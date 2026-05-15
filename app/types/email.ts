export interface ExpiryOption {
  label: string
  value: number
}

/** 最大有效期：1 年（毫秒） */
export const MAX_EXPIRY_MS = 1000 * 60 * 60 * 24 * 365

/** 最小有效期：1 分钟（毫秒） */
export const MIN_EXPIRY_MS = 1000 * 60

/** 创建邮箱时的预设快捷选项 */
export const EXPIRY_PRESETS: ExpiryOption[] = [
  { label: '1小时', value: 1000 * 60 * 60 },
  { label: '1天', value: 1000 * 60 * 60 * 24 },
  { label: '7天', value: 1000 * 60 * 60 * 24 * 7 },
  { label: '30天', value: 1000 * 60 * 60 * 24 * 30 },
  { label: '1年', value: 1000 * 60 * 60 * 24 * 365 },
]

/**
 * 自定义有效期的时间单位定义
 * NOTE: factor 表示该单位换算到毫秒的系数
 */
export const EXPIRY_UNITS = [
  { label: '分钟', value: 'minute', factor: 1000 * 60, max: 60 * 24 * 365 },
  { label: '小时', value: 'hour', factor: 1000 * 60 * 60, max: 24 * 365 },
  { label: '天', value: 'day', factor: 1000 * 60 * 60 * 24, max: 365 },
  { label: '周', value: 'week', factor: 1000 * 60 * 60 * 24 * 7, max: 52 },
  { label: '月', value: 'month', factor: 1000 * 60 * 60 * 24 * 30, max: 12 },
] as const

export type ExpiryUnitValue = typeof EXPIRY_UNITS[number]['value']

/**
 * 校验有效期是否在允许范围内
 * @param expiryMs 有效期（毫秒）
 * @returns 是否合法
 */
export function isValidExpiry(expiryMs: number): boolean {
  if (!Number.isFinite(expiryMs) || expiryMs <= 0) return false
  return expiryMs >= MIN_EXPIRY_MS && expiryMs <= MAX_EXPIRY_MS
}

// NOTE: 保留旧的 EXPIRY_OPTIONS 导出以兼容分享对话框等其他使用方
export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1小时', value: 1000 * 60 * 60 },
  { label: '24小时', value: 1000 * 60 * 60 * 24 },
  { label: '3天', value: 1000 * 60 * 60 * 24 * 3 },
  { label: '7天', value: 1000 * 60 * 60 * 24 * 7 },
  { label: '永久', value: 0 }
]
