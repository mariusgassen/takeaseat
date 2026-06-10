import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { UsersTable } from "./users-table";

vi.mock("@/lib/i18n/context", () => ({
  useLocale: () => ({
    t: {
      admin: {
        usersTitle: "Users",
        noUsers: "No users yet.",
        userEmail: "Email",
        userRole: "Role",
        delete: "Delete",
        roles: { admin: "Admin", manager: "Manager", member: "Member", guest: "Guest" },
      },
    },
  }),
}));

vi.mock("@/lib/api/admin-client", () => ({
  apiListUsers: vi.fn(),
  apiPatchUser: vi.fn(),
  apiDeleteUser: vi.fn(),
}));

import { apiListUsers, apiPatchUser, apiDeleteUser } from "@/lib/api/admin-client";

const mockUsers = [
  { id: "u1", tenant_id: "t1", email: "alice@a.com", name: "Alice", role: "admin", created_at: "" },
  { id: "u2", tenant_id: "t1", email: "bob@b.com", name: "Bob", role: "member", created_at: "" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UsersTable", () => {
  it("renders user rows after loading", async () => {
    (apiListUsers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ users: mockUsers });
    render(<UsersTable />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("shows empty state when no users", async () => {
    (apiListUsers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ users: [] });
    render(<UsersTable />);
    await waitFor(() => {
      expect(screen.getByText("No users yet.")).toBeInTheDocument();
    });
  });

  it("calls apiPatchUser when role is changed", async () => {
    (apiListUsers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ users: [mockUsers[0]] });
    (apiPatchUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockUsers[0],
      role: "manager",
    });

    render(<UsersTable />);
    await waitFor(() => screen.getByText("Alice"));

    const roleSelect = screen.getByRole("combobox", { name: /role for alice/i });
    await userEvent.selectOptions(roleSelect, "manager");

    await waitFor(() => {
      expect(apiPatchUser).toHaveBeenCalledWith("u1", { name: "Alice", role: "manager" });
    });
  });

  it("removes row when delete is clicked", async () => {
    (apiListUsers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ users: mockUsers });
    (apiDeleteUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    render(<UsersTable />);
    await waitFor(() => screen.getByText("Alice"));
    await userEvent.click(screen.getByRole("button", { name: /delete alice/i }));

    await waitFor(() => {
      expect(apiDeleteUser).toHaveBeenCalledWith("u1");
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
