"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addContactAction,
  deleteContactAction,
} from "@/app/(app)/companies/actions";
import type { Contact } from "@/types/crm";

export function ContactsPanel({
  companyId,
  contacts,
}: {
  companyId: string;
  contacts: Contact[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {contacts.length === 0 && (
          <li className="text-sm text-zinc-500">No contacts yet.</li>
        )}
        {contacts.map((c) => (
          <li
            key={c.id}
            className="flex items-start justify-between gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2"
          >
            <div>
              <p className="font-medium">
                {c.name}
                {c.is_primary && (
                  <span className="ml-2 text-xs text-amber-700">primary</span>
                )}
              </p>
              <p className="text-sm text-zinc-500">{c.title || "—"}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
                {c.email && <span>{c.email}</span>}
                {c.linkedin_url && (
                  <a
                    href={c.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  await deleteContactAction(companyId, c.id);
                })
              }
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      <form
        className="grid gap-2 rounded-md border border-dashed border-zinc-200 p-3 sm:grid-cols-2"
        action={(fd) => {
          startTransition(async () => {
            await addContactAction(companyId, fd);
          });
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="cname">Name</Label>
          <Input id="cname" name="name" required placeholder="Jane Smith" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ctitle">Title</Label>
          <Input
            id="ctitle"
            name="title"
            placeholder="CTO / Founder / VP Eng"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cemail">Email</Label>
          <Input id="cemail" name="email" type="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="clinkedin">LinkedIn</Label>
          <Input id="clinkedin" name="linkedin_url" type="url" />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="is_primary"
            name="is_primary"
            type="checkbox"
            className="size-4 rounded border"
          />
          <Label htmlFor="is_primary">Primary contact</Label>
        </div>
        <Button type="submit" disabled={pending} className="sm:col-span-2">
          {pending ? "Adding…" : "Add contact"}
        </Button>
      </form>
    </div>
  );
}
