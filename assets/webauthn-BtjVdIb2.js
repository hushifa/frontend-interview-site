var e={notesHtml:`<p>W3C WebAuthn 规范，定义网页通过 <code>navigator.credentials.create()</code> 和 <code>get()</code> 使用公钥凭证，是 Passkey 的技术基础。</p>
<p>规范说明了 RP ID、origin、challenge、用户验证和响应格式。服务端要生成一次性 challenge，并校验 origin、RP ID 和签名；账号恢复、会话管理要自己设计。部分认证器的签名计数器始终为 0，不能把计数器不递增直接当作攻击。CBOR 和签名解析用维护中的库，不要手写。</p>
<p>许可：W3C 文档许可。</p>`};export{e as default};