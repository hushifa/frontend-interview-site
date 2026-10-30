var e={notesHtml:`<p><code>startRegistration</code> 和 <code>startAuthentication</code> 接收服务端生成的选项，调用认证器并返回可提交给服务端的响应；<code>browserSupportsWebAuthn</code> 用于检测浏览器是否支持。</p>
<p>它只负责浏览器端，challenge 生成和响应校验要在服务端完成，同一项目提供 <code>@simplewebauthn/server</code>。需要在 IE11、旧版 Edge 中做功能检测时，可用带 polyfill 的 ES5 UMD 包。</p>
<p>许可：MIT。</p>`};export{e as default};