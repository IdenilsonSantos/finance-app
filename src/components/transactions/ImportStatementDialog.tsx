"use client";

import { useRef, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, Info, RefreshCw, Plus, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WalletFormDialog } from "@/components/wallets/WalletFormDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BankAccountResponse } from "@/types/api";
import { CreateWalletPayload, UpdateWalletPayload } from "@/hooks/useWallets";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface ImportResult {
  imported: number;
  duplicates: number;
  total: number;
  accountCreated?: boolean;
  accountName?: string;
  alreadyImported?: boolean;
  previousImportAt?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccounts: BankAccountResponse[];
  onSuccess: () => void;
}

export function ImportStatementDialog({ open, onOpenChange, bankAccounts, onSuccess }: Props) {
  const [accountId, setAccountId] = useState("");
  const [extraAccounts, setExtraAccounts] = useState<BankAccountResponse[]>([]);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allAccounts = [
    ...bankAccounts,
    ...extraAccounts.filter((e) => !bankAccounts.some((b) => b.id === e.id)),
  ];

  function handleClose() {
    if (loading) return;
    onOpenChange(false);
    setTimeout(() => {
      setAccountId("");
      setExtraAccounts([]);
      setFile(null);
      setResult(null);
    }, 200);
  }

  function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".ofx")) {
      toast.error("Apenas arquivos .ofx são suportados");
      return;
    }
    setFile(f);
    setResult(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleCreateAccount(data: CreateWalletPayload) {
    const created = await api.post<BankAccountResponse>("/bank-accounts", data);
    setExtraAccounts((prev) => [...prev, created]);
    setAccountId(created.id);
    setWalletDialogOpen(false);
  }

  async function handleImport(force = false) {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (accountId) form.append("bankAccountId", accountId);
      if (force) form.append("force", "true");
      const data = await api.upload<ImportResult>("/bank-accounts/import-statement", form);
      if (data.alreadyImported) {
        setResult(data);
        return;
      }
      setResult(data);
      if (data.imported > 0 || data.accountCreated) {
        onSuccess();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar extrato");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!file && !loading;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Importar extrato
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Conta bancária{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="flex gap-2">
                <Select value={accountId} onValueChange={setAccountId} disabled={loading}>
                  <SelectTrigger className="h-10 rounded-xl text-sm flex-1">
                    <SelectValue placeholder="Detectar automaticamente do arquivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2">
                          <Landmark className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          {a.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={loading}
                      onClick={() => setWalletDialogOpen(true)}
                      className="h-10 w-10 rounded-xl shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Criar nova conta bancária</TooltipContent>
                </Tooltip>
              </div>
              {!accountId && (
                <p className="text-xs text-slate-400 flex items-start gap-1.5 pt-0.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                  Se nenhuma conta for selecionada, o nome será detectado automaticamente do arquivo.
                </p>
              )}
            </div>

            {!result ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onClick={() => !loading && inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150",
                  dragging
                    ? "border-[#1E1E2D] bg-slate-50 scale-[1.01]"
                    : file
                    ? "border-slate-300 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  loading && "pointer-events-none opacity-60",
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".ofx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-5 h-5 text-slate-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <div className={cn(
                        "p-3 rounded-xl transition-colors",
                        dragging ? "bg-[#1E1E2D]" : "bg-slate-100",
                      )}>
                        <Upload className={cn(
                          "w-5 h-5 transition-colors",
                          dragging ? "text-white" : "text-slate-400",
                        )} />
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm font-semibold transition-colors",
                      dragging ? "text-[#1E1E2D]" : "text-slate-700",
                    )}>
                      {dragging ? "Solte para importar" : "Arraste o arquivo ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-slate-400">Somente arquivos .ofx</p>
                  </div>
                )}
              </div>
            ) : result.alreadyImported ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-px" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Extrato já importado</p>
                    {result.previousImportAt && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Importado em{" "}
                        {new Date(result.previousImportAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 pl-7">
                  Este arquivo já foi processado anteriormente. Deseja importar mesmo assim? Transações duplicadas serão ignoradas automaticamente.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  {result.imported > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {result.imported > 0 ? "Importação concluída" : "Nenhuma transação nova"}
                    </p>
                    {result.accountCreated && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Conta criada: <strong>{result.accountName}</strong>
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-xl font-bold text-slate-900">{result.total}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">no arquivo</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-emerald-100">
                    <p className="text-xl font-bold text-emerald-600">{result.imported}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">importadas</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
                    <p className="text-xl font-bold text-slate-400">{result.duplicates}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">duplicatas</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {result?.alreadyImported ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 rounded-2xl h-11 font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleImport(true)}
                    disabled={loading}
                    className="flex-1 bg-[#1E1E2D] text-white hover:bg-slate-800 rounded-2xl h-11 font-semibold gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Importar mesmo assim
                  </Button>
                </>
              ) : result ? (
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-[#1E1E2D] text-white hover:bg-slate-800 rounded-2xl h-11 font-semibold"
                >
                  Fechar
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 rounded-2xl h-11 font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleImport()}
                    disabled={!canSubmit}
                    className="flex-1 bg-[#1E1E2D] text-white hover:bg-slate-800 rounded-2xl h-11 font-semibold gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Importar
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WalletFormDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        wallet={null}
        onCreate={handleCreateAccount}
        onUpdate={async (_id: string, _data: UpdateWalletPayload) => {}}
      />
    </>
  );
}
