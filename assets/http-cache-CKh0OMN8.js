var e={answerHtml:`<p>缓存仍新鲜时，可以依据 Cache-Control 等信息复用响应；缓存过期或需要验证时，可以通过 If-None-Match 携带 ETag，或通过 If-Modified-Since 携带修改时间向服务端验证。资源未变时可返回 304，客户端复用缓存实体。</p>
<p><code>no-cache</code> 允许存储，但复用前需要验证；<code>no-store</code> 要求不存储。两者不能混淆。</p>
<p>常见策略是 HTML 使用适当的重新验证策略，带内容哈希的静态资源使用较长缓存时间。具体响应头由托管服务或 CDN 控制。</p>`};export{e as default};