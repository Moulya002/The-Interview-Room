"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

export function EditProfileDialog({
  initialName,
  initialBio,
  initialAvatar,
}: {
  initialName: string;
  initialBio: string;
  initialAvatar: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(initialName);
  const [bio, setBio] = React.useState(initialBio);
  const [avatar, setAvatar] = React.useState(initialAvatar);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/api/users/me", { name, bio, avatar });
      toast({ title: "Profile updated" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Could not update",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" /> Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Avatar URL</Label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              maxLength={280}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
