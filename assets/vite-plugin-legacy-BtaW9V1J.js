var e={notesHtml:`<p>Vite 官方插件，为每个 chunk 额外生成经 @babel/preset-env 转换的 SystemJS 旧版产物，并按目标浏览器和实际用到的特性生成 polyfill chunk。</p>
<p>插件通过 <code>&lt;script nomodule&gt;</code> 让只有旧浏览器才加载 legacy 产物，代码中可用 <code>import.meta.env.LEGACY</code> 判断。构建时间和产物数量都会增加，只在确实需要支持旧浏览器时启用。</p>
<p>许可：MIT（vitejs/vite 仓库 LICENSE 与 npm 包 license 字段均为 MIT）。</p>`};export{e as default};