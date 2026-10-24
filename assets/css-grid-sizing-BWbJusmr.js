var e={answerHtml:`<p>fr 分配网格容器中可用的剩余空间，轨道的最小尺寸和内容贡献会影响最终结果。minmax(0, 1fr) 允许轨道小于内容的自动最小宽度，是处理长内容溢出的常见办法。</p>
<p>repeat 配合 auto-fill 或 auto-fit 可以创建随容器宽度变化的列数。auto-fill 会保留可容纳的空轨道；auto-fit 会折叠空轨道，使已有项目可以进一步扩展。</p>
<p>布局卡片时要同时考虑最小列宽、gap 和窄屏行为，不能只看大屏效果。视觉重排不应该破坏 DOM 阅读与键盘顺序。Grid 适合二维对齐，卡片内部的一维排列仍可使用 Flex。</p>`};export{e as default};