"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Dashboard: notes list + create + edit + delete + admin invite + upgrade
 *
 * Requirements:
 * - Expects `localStorage.token` and `localStorage.user` (set by /login)
 * - Calls:
 *   GET  /api/notes
 *   POST /api/notes
 *   PUT  /api/notes/:id
 *   DELETE /api/notes/:id
 *   POST /api/tenants/:slug/upgrade
 *   POST /api/users/invite
 *
 * If tenant slug isn't available in stored user, admin can type it once.
 */

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // notes state
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");

  // create note
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // edit note
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // invite (admin)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [invitePassword, setInvitePassword] = useState("");

  // tenant/upgrade info
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantPlan, setTenantPlan] = useState(null);
  const [freeLimitReached, setFreeLimitReached] = useState(false);
  const FREE_LIMIT = 3;

  // helper: read token & user on mount
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t || !u) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(u);
    setToken(t);
    setUser(parsed);

    // tenant slug fallback: try multiple shapes
    const slug =
      parsed?.tenant?.slug ||
      parsed?.tenantSlug ||
      parsed?.tenantSlug?.toString?.() ||
      parsed?.tenant?.name?.toLowerCase?.() ||
      "";
    setTenantSlug(slug);
  }, [router]);

  // fetch notes (and optionally tenant info) once token + user available
  useEffect(() => {
    if (!token) return;
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchNotes() {
    setLoadingNotes(true);
    setError("");
    try {
      const res = await fetch("/api/notes", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      const data = await res.json();

      // API returns either { error } or array
      if (!Array.isArray(data)) {
        // If backend sends an object with tenant info after some action, handle gracefully
        if (data?.error) {
          setError(data.error);
          setNotes([]);
        } else {
          // If backend returns an object, try grabbing notes array field
          // But normally we expect an array
          setNotes([]);
        }
      } else {
        setNotes(
          data.map((n) => ({
            id: n._id || n.id,
            title: n.title,
            content: n.content,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
          }))
        );

        // check free-plan limit status if we can infer plan
        // We may not have tenant plan from this endpoint, but we can guess: if notes >= FREE_LIMIT and user is member/admin show upgrade prompt
        setFreeLimitReached(data.length >= FREE_LIMIT);
      }

      // Optionally: fetch tenant info if you have an endpoint or backend provided tenant in login
      // If user contains tenant info, set plan from there:
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser?.tenant?.plan) {
        setTenantPlan(storedUser.tenant.plan);
        setTenantSlug(storedUser.tenant.slug || tenantSlug);
      }
    } catch (err) {
      console.error("fetchNotes error", err);
      setError("Failed to load notes");
    } finally {
      setLoadingNotes(false);
    }
  }

  // Create note
  async function handleCreateNote(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create note");
      }

      const created = await res.json();
      // Add to list (backend returns { id,title,... } or Mongoose doc)
      const note = {
        id: created._id || created.id,
        title: created.title,
        content: created.content,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
      setNotes((s) => [note, ...s]);
      setTitle("");
      setContent("");
      setFreeLimitReached((prev) => {
        const newCount = notes.length + 1;
        return newCount >= FREE_LIMIT;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  // Start editing
  function startEdit(n) {
    setEditing(n.id);
    setEditTitle(n.title);
    setEditContent(n.content);
  }

  // Cancel edit
  function cancelEdit() {
    setEditing(null);
    setEditTitle("");
    setEditContent("");
  }

  // Save edit
  async function saveEdit(e) {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`/api/notes/${editing}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update note");
      }
      const updated = await res.json();
      setNotes((s) => s.map((n) => (n.id === editing ? { ...n, title: updated.title, content: updated.content, updatedAt: updated.updatedAt } : n)));
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete note
  async function handleDelete(noteId) {
    if (!confirm("Delete this note?")) return;
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete");
      }
      // remove locally
      setNotes((s) => s.filter((n) => n.id !== noteId));
      setFreeLimitReached((prev) => {
        const newCount = Math.max(0, notes.length - 1);
        return newCount >= FREE_LIMIT;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  // Upgrade tenant to pro (ADMIN only)
  async function handleUpgrade() {
    setError("");
    // determine slug: prefer stored user tenant slug, otherwise use manually entered tenantSlug
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const slugFromUser = storedUser?.tenant?.slug || storedUser?.tenantSlug;
    const slugToUse = slugFromUser || tenantSlug;
    if (!slugToUse) {
      setError("Tenant slug missing. Admin must enter tenant slug to upgrade.");
      return;
    }

    try {
      const res = await fetch(`/api/tenants/${slugToUse}/upgrade`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "Upgrade failed");
      }
      // success: update tenantPlan & refresh notes behaviour
      setTenantPlan(d.tenant?.plan || "pro");
      setFreeLimitReached(false);
      // if login stored tenant info, update it
      if (storedUser?.tenant) {
        storedUser.tenant.plan = d.tenant?.plan || "pro";
        localStorage.setItem("user", JSON.stringify(storedUser));
        setUser(storedUser);
      }
      alert("Tenant upgraded to pro.");
    } catch (err) {
      setError(err.message);
    }
  }

  // Invite user (ADMIN only)
  async function handleInvite(e) {
    e.preventDefault();
    setError("");
    try {
      const body = { email: inviteEmail, role: inviteRole, password: invitePassword };
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Invite failed");
      alert(d.message || "User invited");
      setInviteEmail("");
      setInvitePassword("");
      setInviteRole("MEMBER");
    } catch (err) {
      setError(err.message);
    }
  }

  // logout
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  // UI rendering
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notes Dashboard</h1>
            <p className="text-sm text-gray-300">
              {user?.email} • {user?.role} {user?.tenant?.name ? `• ${user.tenant.name}` : ""}
            </p>
            {tenantPlan && <p className="text-xs mt-1">Tenant plan: <b>{tenantPlan}</b></p>}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={logout} className="bg-red-600 px-3 py-2 rounded text-white hover:bg-red-700">Logout</button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: create / invite / upgrade */}
          <section className="lg:col-span-1 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="font-semibold mb-2">Create Note</h2>

            {error && <div className="bg-red-800 text-red-200 p-2 rounded mb-2">{error}</div>}

            <form onSubmit={handleCreateNote}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 rounded bg-gray-700 mb-2 border border-gray-600" required />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" rows={4} className="w-full p-2 rounded bg-gray-700 mb-2 border border-gray-600" required />
              <button type="submit" className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700">Create</button>
            </form>

            <hr className="my-4 border-gray-700" />

            {/* Upgrade UI */}
            <div>
              <h3 className="font-semibold mb-2">Subscription</h3>
              <p className="text-sm text-gray-300 mb-2">Free plan: max {FREE_LIMIT} notes. Pro: unlimited.</p>

              { (tenantPlan === "free" || !tenantPlan) && freeLimitReached && (
                <>
                  <div className="mb-2 text-yellow-300">Free plan limit reached. Upgrade to Pro to add more notes.</div>

                  <div className="mb-3">
                    {/* allow admin to input slug if missing */}
                    {!user?.tenant?.slug && !tenantSlug && (
                      <input placeholder="Tenant slug (e.g. globex)" value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} className="w-full p-2 rounded bg-gray-700 mb-2 border border-gray-600" />
                    )}
                    <button onClick={handleUpgrade} className="w-full bg-green-600 py-2 rounded hover:bg-green-700">Upgrade to Pro (Admin only)</button>
                  </div>
                </>
              )}

              {tenantPlan === "pro" && <div className="text-green-300">Tenant is on Pro plan.</div>}
            </div>

            <hr className="my-4 border-gray-700" />

            {/* Invite (ADMIN) */}
            {user?.role?.toUpperCase() === "ADMIN" && (
              <div>
                <h3 className="font-semibold mb-2">Invite User (Admin)</h3>
                <form onSubmit={handleInvite}>
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email" className="w-full p-2 rounded bg-gray-700 mb-2 border border-gray-600" required />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full p-2 rounded bg-gray-700 mb-2 border border-gray-600">
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <input value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} placeholder="Password" className="w-full p-2 rounded bg-gray-700 mb-2 border border-gray-600" required />
                  <button type="submit" className="w-full bg-indigo-600 py-2 rounded hover:bg-indigo-700">Invite</button>
                </form>
              </div>
            )}
          </section>

          {/* Right: notes list */}
          <section className="lg:col-span-2 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="font-semibold mb-4">Notes {loadingNotes && "(loading...)"}</h2>

            {notes.length === 0 ? (
              <p className="text-gray-400">No notes yet.</p>
            ) : (
              <div className="space-y-4">
                {notes.map((n) => (
                  <div key={n.id} className="bg-gray-900 p-3 rounded border border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{n.title}</h3>
                        <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{n.content}</p>
                        <p className="text-xs text-gray-500 mt-2">Updated: {new Date(n.updatedAt || n.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(n)} className="px-2 py-1 text-sm bg-yellow-600 rounded hover:bg-yellow-700">Edit</button>
                          <button onClick={() => handleDelete(n.id)} className="px-2 py-1 text-sm bg-red-600 rounded hover:bg-red-700">Delete</button>
                        </div>
                      </div>
                    </div>

                    {/* inline edit form */}
                    {editing === n.id && (
                      <form onSubmit={saveEdit} className="mt-3 space-y-2">
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600" required />
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} className="w-full p-2 rounded bg-gray-700 border border-gray-600" required />
                        <div className="flex gap-2">
                          <button type="submit" className="px-3 py-1 bg-green-600 rounded hover:bg-green-700">Save</button>
                          <button type="button" onClick={cancelEdit} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
