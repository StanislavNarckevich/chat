"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function useConfirmDialog() {
    const [open, setOpen] = useState(false);
    const [resolveFn, setResolveFn] = useState<(value: boolean) => void>(() => {});

    const confirm = () =>
        new Promise<boolean>((resolve) => {
            setResolveFn(() => resolve);
            setOpen(true);
        });

    const handleConfirm = () => {
        resolveFn(true);
        setOpen(false);
    };

    const handleCancel = () => {
        resolveFn(false);
        setOpen(false);
    };

    const dialog = (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to perform this action?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return { confirm, dialog };
}