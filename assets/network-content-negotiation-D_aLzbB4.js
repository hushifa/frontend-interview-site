var e={answerHtml:`<p>内容协商让客户端通过请求头表达偏好，服务端选择媒体类型、语言或压缩方式。<code>Accept</code> 与 <code>Content-Type</code> 关注媒体格式，<code>Accept-Language</code> 关注语言，<code>Accept-Encoding</code> 关注传输编码。</p>
<p>如果响应会根据请求头变化，缓存键必须通过 <code>Vary</code> 正确表达，否则一个语言、编码或格式的响应可能被错误复用给另一个请求。CDN、浏览器缓存和服务端框架都要保持一致。</p>
<p>协商不是“客户端一定得到最喜欢的格式”。服务端可能返回默认版本或 406，也要处理语言回退、压缩失败和 API 版本兼容。</p>`};export{e as default};