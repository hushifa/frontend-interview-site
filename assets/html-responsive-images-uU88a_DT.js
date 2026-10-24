var e={answerHtml:`<p>srcset 提供多个候选资源，使用宽度描述符时，sizes 告诉浏览器图像在布局中预计占用的宽度，浏览器结合设备像素比等条件选择候选。sizes 描述的是展示尺寸，不是文件大小。</p>
<p>picture 可以按媒体条件或格式提供 source，适合艺术裁切和格式回退。img 仍负责替代文本及最终回退。显式 width 和 height 或合理 aspect-ratio 能预留布局空间，减少偏移。</p>
<p>首屏关键图片不宜统一设置懒加载；非首屏图片可按需延迟。图片过大、错误的 sizes 和高成本格式转换都可能抵消优化，应结合实际请求与 LCP 测量验证。</p>`};export{e as default};