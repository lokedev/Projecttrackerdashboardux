import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { useState } from "react";

interface AddPhaseDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (phaseName: string) => void;
}

export function AddPhaseDialog({
  open,
  onClose,
  onAdd,
}: AddPhaseDialogProps) {
  const [phaseName, setPhaseName] = useState("");

  const handleAdd = () => {
    if (phaseName.trim()) {
      onAdd(phaseName.trim());
      setPhaseName("");
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Phase</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phase-name">Phase Name</Label>
            <Input
              id="phase-name"
              placeholder="Enter phase name"
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!phaseName.trim()}>
            Add Phase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
