var e={answerHtml:`<p>WebXR 通过 <code>XRSession</code> 管理沉浸式或内联会话，再由设备提供帧、姿态和输入源。应用需要选择合适的 session mode 和 reference space，不能假设所有设备都支持同一种空间或控制器。</p>
<p>渲染循环通常由 XR 帧调度驱动，视图数量、视口和相机矩阵由设备提供。会话可能被用户、浏览器或设备中断，结束时要释放 WebGL 资源、停止动画并恢复普通页面交互。</p>
<p>WebXR 需要安全上下文和用户激活，兼容性、隐私权限和设备差异都很大。应提供非 XR 的二维体验，不要把沉浸式模式当作唯一业务路径。</p>`};export{e as default};