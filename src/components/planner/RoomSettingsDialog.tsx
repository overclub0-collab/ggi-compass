import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoomDimensions } from '@/types/planner';

interface RoomSettingsDialogProps {
  roomDimensions: RoomDimensions;
  onSave: (dimensions: RoomDimensions) => void;
}

export const RoomSettingsDialog = ({ roomDimensions, onSave }: RoomSettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(roomDimensions.width / 1000); // mm to m
  const [height, setHeight] = useState(roomDimensions.height / 1000);

  const handleSave = () => {
    onSave({
      width: width * 1000, // m to mm
      height: height * 1000,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          공간 크기 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>공간 크기 설정</DialogTitle>
          <DialogDescription>
            배치할 공간의 가로와 세로 크기를 미터(m) 단위로 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              가로
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="width"
                type="number"
                min={1}
                max={20}
                step={0.1}
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">m</span>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">
              세로
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="height"
                type="number"
                min={1}
                max={20}
                step={0.1}
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 1)}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">m</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
