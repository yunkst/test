// 极简插值：替换文案中的 {key} 占位符。
// 字典保持纯数据（见 zh.ts 说明），渲染时在此处注入动态值。
export function t(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? ''),
  )
}