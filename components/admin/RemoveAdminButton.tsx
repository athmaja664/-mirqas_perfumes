"use client";

import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

export default function RemoveAdminButton({ name }: { name: string }) {
  return (
    <ConfirmDeleteButton
      label={`Remove ${name} as admin`}
      title="Remove admin?"
      confirmLabel="Remove"
      message={`Remove ${name} as admin?\n\nThe account becomes a customer and is logged out at once.`}
    />
  );
}