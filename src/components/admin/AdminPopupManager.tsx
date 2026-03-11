import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";


interface Popup {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
}

const POPUP_SIZES = [
  { label: "소형 (400×500)", width: 400, height: 500 },
  { label: "중형 (500×600)", width: 500, height: 600 },
  { label: "대형 (600×700)", width: 600, height: 700 },
  { label: "와이드 (700×500)", width: 700, height: 500 },
  { label: "정사각 (500×500)", width: 500, height: 500 },
  { label: "사용자 지정", width: 0, height: 0 },
];

const initialForm = {
  title: "",
  image_url: "",
  link_url: "",
  width: 500,
  height: 600,
  position_x: 100,
  position_y: 100,
  is_active: false,
  display_order: 0,
  start_date: "",
  end_date: "",
};

export default function AdminPopupManager() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [selectedSize, setSelectedSize] = useState("중형 (500×600)");

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("popups")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("팝업 목록을 불러오는데 실패했습니다.");
    } else {
      setPopups((data || []) as Popup[]);
    }
    setIsLoading(false);
  };

  const handleSizeSelect = (label: string) => {
    setSelectedSize(label);
    const size = POPUP_SIZES.find((s) => s.label === label);
    if (size && size.width > 0) {
      setForm((prev) => ({ ...prev, width: size.width, height: size.height }));
    }
  };

  const handleEdit = (popup: Popup) => {
    setEditingId(popup.id);
    setForm({
      title: popup.title,
      image_url: popup.image_url || "",
      link_url: popup.link_url || "",
      width: popup.width,
      height: popup.height,
      position_x: popup.position_x,
      position_y: popup.position_y,
      is_active: popup.is_active,
      display_order: popup.display_order,
      start_date: popup.start_date ? popup.start_date.slice(0, 16) : "",
      end_date: popup.end_date ? popup.end_date.slice(0, 16) : "",
    });
    const match = POPUP_SIZES.find((s) => s.width === popup.width && s.height === popup.height);
    setSelectedSize(match ? match.label : "사용자 지정");
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(initialForm);
    setSelectedSize("중형 (500×600)");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("팝업 제목을 입력해주세요.");
      return;
    }

    const data = {
      title: form.title,
      image_url: form.image_url || null,
      link_url: form.link_url || null,
      width: form.width,
      height: form.height,
      position_x: form.position_x,
      position_y: form.position_y,
      is_active: form.is_active,
      display_order: form.display_order,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    };

    if (editingId) {
      const { error } = await supabase.from("popups").update(data).eq("id", editingId);
      if (error) {
        toast.error("팝업 수정 실패: " + error.message);
        return;
      }
      toast.success("팝업이 수정되었습니다.");
    } else {
      const { error } = await supabase.from("popups").insert([data]);
      if (error) {
        toast.error("팝업 추가 실패: " + error.message);
        return;
      }
      toast.success("팝업이 추가되었습니다.");
    }

    setDialogOpen(false);
    fetchPopups();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 팝업을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("popups").delete().eq("id", id);
    if (error) {
      toast.error("삭제 실패: " + error.message);
    } else {
      toast.success("팝업이 삭제되었습니다.");
      fetchPopups();
    }
  };

  const handleToggleActive = async (popup: Popup) => {
    const { error } = await supabase
      .from("popups")
      .update({ is_active: !popup.is_active })
      .eq("id", popup.id);
    if (error) {
      toast.error("상태 변경 실패");
    } else {
      fetchPopups();
    }
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `popup-${Date.now()}.${fileExt}`;
    const filePath = `popups/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("이미지 업로드 실패: " + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    toast.success("이미지가 업로드되었습니다.");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">팝업 관리</h2>
        <Button onClick={handleAdd} className="min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          팝업 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : popups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>등록된 팝업이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popups.map((popup) => (
            <Card key={popup.id} className={`relative ${!popup.is_active ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base truncate">{popup.title}</CardTitle>
                  <Switch
                    checked={popup.is_active}
                    onCheckedChange={() => handleToggleActive(popup)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {popup.width}×{popup.height}px
                  {popup.is_active ? " · 활성" : " · 비활성"}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {popup.image_url ? (
                  <div className="border rounded-md overflow-hidden bg-muted aspect-video">
                    <img
                      src={popup.image_url}
                      alt={popup.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="border rounded-md bg-muted aspect-video flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(popup)} className="flex-1">
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewPopup(popup);
                      setPreviewOpen(true);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(popup.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "팝업 수정" : "새 팝업 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>팝업 제목 *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="예: 신제품 출시 안내"
              />
            </div>

            <div>
              <Label>팝업 사이즈</Label>
              <Select value={selectedSize} onValueChange={handleSizeSelect}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POPUP_SIZES.map((s) => (
                    <SelectItem key={s.label} value={s.label}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSize === "사용자 지정" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>너비 (px)</Label>
                  <Input
                    type="number"
                    value={form.width}
                    onChange={(e) => setForm((p) => ({ ...p, width: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>높이 (px)</Label>
                  <Input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm((p) => ({ ...p, height: Number(e.target.value) }))}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>팝업 이미지</Label>
              {form.image_url ? (
                <div className="space-y-2">
                  <div className="border rounded-md overflow-hidden bg-muted">
                    <img src={form.image_url} alt="팝업 미리보기" className="w-full object-contain max-h-[300px]" />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={form.image_url}
                      onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                      placeholder="이미지 URL"
                      className="flex-1"
                    />
                    <Button variant="destructive" size="sm" onClick={() => setForm((p) => ({ ...p, image_url: "" }))}>
                      삭제
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageDropzone
                    onFileSelect={handleImageUpload}
                    currentImage={null}
                    label="팝업 이미지를 드래그하거나 클릭하여 업로드"
                  />
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="또는 이미지 URL 직접 입력"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>클릭 시 이동 URL (선택)</Label>
              <Input
                value={form.link_url}
                onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>시작일시 (선택)</Label>
                <Input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>종료일시 (선택)</Label>
                <Input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>표시 순서</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
              <Label>활성화</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSave}>저장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>팝업 미리보기: {previewPopup?.title}</DialogTitle>
          </DialogHeader>
          {previewPopup && (
            <div className="flex justify-center">
              <div
                className="border-2 border-dashed border-primary/30 rounded-lg overflow-hidden bg-background relative"
                style={{
                  width: Math.min(previewPopup.width, 600),
                  height: Math.min(previewPopup.height, 500),
                }}
              >
                {previewPopup.image_url ? (
                  <img
                    src={previewPopup.image_url}
                    alt={previewPopup.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    이미지 없음
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-muted/90 p-2 flex justify-between text-xs border-t">
                  <button className="hover:underline text-muted-foreground">오늘 하루 보지 않기</button>
                  <button className="hover:underline text-muted-foreground">1주일간 보지 않기</button>
                  <button className="hover:underline font-medium text-foreground">닫기</button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
