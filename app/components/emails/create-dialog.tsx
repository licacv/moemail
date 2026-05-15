"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Copy, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { nanoid } from "nanoid"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EXPIRY_PRESETS, EXPIRY_UNITS, MAX_EXPIRY_MS, MIN_EXPIRY_MS, isValidExpiry } from "@/types/email"
import type { ExpiryUnitValue } from "@/types/email"
import { useCopy } from "@/hooks/use-copy"
import { useConfig } from "@/hooks/use-config"

interface CreateDialogProps {
  onEmailCreated: () => void
}

/** 自定义有效期的标识值，用于区分预设和自定义模式 */
const CUSTOM_MODE = "custom"

export function CreateDialog({ onEmailCreated }: CreateDialogProps) {
  const { config } = useConfig()
  const t = useTranslations("emails.create")
  const tList = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailName, setEmailName] = useState("")
  const [currentDomain, setCurrentDomain] = useState("")
  const { toast } = useToast()
  const { copyToClipboard } = useCopy()

  // NOTE: 有效期选择分为预设模式和自定义模式
  const [selectedPreset, setSelectedPreset] = useState(EXPIRY_PRESETS[1].value.toString())
  const [customValue, setCustomValue] = useState(1)
  const [customUnit, setCustomUnit] = useState<ExpiryUnitValue>("day")

  const isCustomMode = selectedPreset === CUSTOM_MODE

  /**
   * 计算最终要提交的有效期（毫秒）
   * 预设模式直接使用预设值，自定义模式根据数值和单位计算
   */
  const computedExpiryMs = useMemo(() => {
    if (!isCustomMode) {
      return parseInt(selectedPreset)
    }
    const unitDef = EXPIRY_UNITS.find(u => u.value === customUnit)
    if (!unitDef) return 0
    return customValue * unitDef.factor
  }, [isCustomMode, selectedPreset, customValue, customUnit])

  /**
   * 获取当前单位允许的最大数值
   * 确保不超过 1 年上限
   */
  const currentUnitMax = useMemo(() => {
    const unitDef = EXPIRY_UNITS.find(u => u.value === customUnit)
    return unitDef?.max ?? 365
  }, [customUnit])

  /** 切换单位时自动将数值修正到合法范围内 */
  const handleUnitChange = useCallback((newUnit: ExpiryUnitValue) => {
    setCustomUnit(newUnit)
    const unitDef = EXPIRY_UNITS.find(u => u.value === newUnit)
    if (unitDef && customValue > unitDef.max) {
      setCustomValue(unitDef.max)
    }
  }, [customValue])

  /** 处理自定义数值输入，限制在 [1, currentUnitMax] 范围内 */
  const handleCustomValueChange = useCallback((val: string) => {
    const num = parseInt(val)
    if (isNaN(num) || num < 1) {
      setCustomValue(1)
    } else if (num > currentUnitMax) {
      setCustomValue(currentUnitMax)
    } else {
      setCustomValue(num)
    }
  }, [currentUnitMax])

  const generateRandomName = () => setEmailName(nanoid(8))

  const copyEmailAddress = () => {
    copyToClipboard(`${emailName}@${currentDomain}`)
  }

  const createEmail = async () => {
    if (!emailName.trim()) {
      toast({
        title: tList("error"),
        description: t("namePlaceholder"),
        variant: "destructive"
      })
      return
    }

    if (!isValidExpiry(computedExpiryMs)) {
      toast({
        title: tList("error"),
        description: t("invalidExpiry"),
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emailName,
          domain: currentDomain,
          expiryTime: computedExpiryMs
        })
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          title: tList("error"),
          description: (data as { error: string }).error,
          variant: "destructive"
        })
        return
      }

      toast({
        title: tList("success"),
        description: t("success")
      })
      onEmailCreated()
      setOpen(false)
      setEmailName("")
    } catch {
      toast({
        title: tList("error"),
        description: t("failed"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if ((config?.emailDomainsArray?.length ?? 0) > 0) {
      setCurrentDomain(config?.emailDomainsArray[0] ?? "")
    }
  }, [config])

  /** 预设选项的 i18n key 映射 */
  const presetLabels = [t("oneHour"), t("oneDay"), t("sevenDays"), t("thirtyDays"), t("oneYear")]

  /** 自定义单位的 i18n key 映射 */
  const unitLabels: Record<ExpiryUnitValue, string> = {
    minute: t("unitMinute"),
    hour: t("unitHour"),
    day: t("unitDay"),
    week: t("unitWeek"),
    month: t("unitMonth"),
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              value={emailName}
              onChange={(e) => setEmailName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="flex-1"
            />
            {(config?.emailDomainsArray?.length ?? 0) > 1 && (
              <Select value={currentDomain} onValueChange={setCurrentDomain}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config?.emailDomainsArray?.map(d => (
                    <SelectItem key={d} value={d}>@{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={generateRandomName}
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* 有效期选择区域 */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("expiryTime")}</Label>
            {/* 预设快捷按钮 */}
            <div className="flex flex-wrap gap-2">
              {EXPIRY_PRESETS.map((preset, index) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={selectedPreset === preset.value.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPreset(preset.value.toString())}
                  className="text-xs"
                >
                  {presetLabels[index]}
                </Button>
              ))}
              <Button
                type="button"
                variant={isCustomMode ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPreset(CUSTOM_MODE)}
                className="text-xs"
              >
                {t("custom")}
              </Button>
            </div>
            {/* 自定义输入区域 */}
            {isCustomMode && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={currentUnitMax}
                  value={customValue}
                  onChange={(e) => handleCustomValueChange(e.target.value)}
                  className="w-24"
                />
                <Select value={customUnit} onValueChange={(v) => handleUnitChange(v as ExpiryUnitValue)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_UNITS.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unitLabels[unit.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground shrink-0">
                  {t("maxOneYear")}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="shrink-0">{t("domain")}:</span>
            {emailName ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{`${emailName}@${currentDomain}`}</span>
                <div
                  className="shrink-0 cursor-pointer hover:text-primary transition-colors"
                  onClick={copyEmailAddress}
                >
                  <Copy className="size-4" />
                </div>
              </div>
            ) : (
              <span className="text-gray-400">...</span>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={createEmail} disabled={loading}>
            {loading ? t("creating") : t("create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
