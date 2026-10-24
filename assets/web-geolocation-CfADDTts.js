var e={answerHtml:`<p>Geolocation API 需要安全上下文和用户许可。<code>getCurrentPosition</code> 适合一次读取，<code>watchPosition</code> 会持续监听并返回 watch ID，组件卸载或不再需要时要调用 <code>clearWatch</code>。</p>
<p>高精度选项可能消耗更多电量、等待更久，也不保证一定得到更准确的位置。应用要处理拒绝、超时、设备不可用和权限变化，不应把坐标当成永远可用的事实。</p>
<p>位置属于敏感数据，应说明用途、最小化保存和共享范围。服务端还要重新校验权限和业务边界，不能只因为浏览器返回了坐标就允许高风险操作。</p>`};export{e as default};