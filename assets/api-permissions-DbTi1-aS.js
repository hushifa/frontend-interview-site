var e={answerHtml:`<p>Permissions.query 查询当前上下文对某项能力的权限状态，常见结果是 granted、denied 或 prompt。它本身通常不是弹出授权框的统一申请入口，实际请求权限由相应功能 API 的流程决定。</p>
<p>权限状态综合考虑安全上下文、Permissions Policy、用户设置以及其他约束。即使此前获准，后续调用仍可能因环境变化或设备不可用而失败，因此业务必须处理实际调用结果。</p>
<p>不同浏览器支持的 permission descriptor 并不一致，对未知名称查询可能失败。页面应在用户真正需要功能时解释用途，并提供拒绝后的替代路径，不能通过反复弹窗把 denied 当成可无限重试的状态。</p>`};export{e as default};