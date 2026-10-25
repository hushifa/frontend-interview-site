var e={answerHtml:`<p>Web App Manifest 是描述 Web 应用安装身份与启动体验的 JSON 文件。浏览器可以从中读取应用名称、图标、启动地址、显示模式和其他受支持配置。</p>
<p>它不是离线缓存清单，也不会因为写了 standalone 就把网站自动变成原生应用。哪些字段被采用、何时更新以及是否展示安装入口，由浏览器和平台共同决定。</p>
<h3>一个部署在子目录的例子</h3>
<p>假设应用部署在 <code>https://example.com/study/</code>，manifest 本身位于该目录：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;manifest&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/study/manifest.webmanifest&quot;</span> /&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;id&quot;: &quot;/study/&quot;,
  &quot;name&quot;: &quot;学习资料库&quot;,
  &quot;short_name&quot;: &quot;资料库&quot;,
  &quot;start_url&quot;: &quot;./&quot;,
  &quot;scope&quot;: &quot;./&quot;,
  &quot;display&quot;: &quot;standalone&quot;,
  &quot;theme_color&quot;: &quot;#ffffff&quot;,
  &quot;background_color&quot;: &quot;#ffffff&quot;,
  &quot;icons&quot;: [
    { &quot;src&quot;: &quot;icons/app-192.png&quot;, &quot;sizes&quot;: &quot;192x192&quot;, &quot;type&quot;: &quot;image/png&quot; },
    { &quot;src&quot;: &quot;icons/app-512.png&quot;, &quot;sizes&quot;: &quot;512x512&quot;, &quot;type&quot;: &quot;image/png&quot; },
    { &quot;src&quot;: &quot;icons/app-maskable.png&quot;, &quot;sizes&quot;: &quot;512x512&quot;, &quot;type&quot;: &quot;image/png&quot;, &quot;purpose&quot;: &quot;maskable&quot; }
  ]
}
</code></pre></div>
<p>start_url、scope 与这些图标的相对路径按相应 manifest 规则解析，不能把它们当成组件源文件路径。这里 start_url 指向 /study/，图标位于 /study/icons/，实际部署必须提供这些文件。</p>
<p>从仓库子路径迁移到独立域名根路径时，应一起检查引用、入口、图标和 scope，避免安装后仍启动到旧路径。不能只确认普通首页能打开。</p>
<h3>id、start_url 和 scope 各有用途</h3>
<p>id 用于稳定标识应用身份，不是登录用户 ID，也不应每次构建随机生成。start_url 决定用户启动时打开哪里，可以与当前安装页面不同，但要满足来源和相关规则。</p>
<p>scope 说明哪些导航 URL 属于已安装应用的范围，影响应用窗口或浏览器 UI 的呈现。它不是访问控制列表，超出 scope 不等于服务器拒绝访问，也不会限制 JavaScript 只能请求这些路径。</p>
<p>Manifest scope 与 Service Worker registration scope 不同：前者管理安装导航上下文，后者影响 worker 控制哪些客户端。两者可能使用相似路径，但不能互相替代或自动同步。</p>
<h3>图标不只是把图片缩小</h3>
<p>sizes 描述实际像素尺寸，type 描述媒体类型，应与资源一致。maskable 图标要按可被系统裁切的安全区域设计，把重要标志留在安全范围内；不是给普通贴边图标加一个 purpose 就一定显示正确。</p>
<p>name 与 short_name 也应考虑不同位置的空间限制。theme_color 和 background_color 用于相应的主题与启动展示提示，不会替代页面自己的 CSS 背景，更不能保证所有系统都采用完全一致的外观。</p>
<h3>display 是偏好，不是能力授权</h3>
<p>standalone、minimal-ui、browser 等描述显示方式，平台会按支持情况处理。display_override 可以为支持的环境提供更细偏好，但仍需回退。</p>
<p>方向、快捷方式和文件处理等其他成员也各有支持与权限边界。声明一个字段不等于用户已经授予系统能力，也不代表网页可以绕过相应 API 的用户交互要求。</p>
<h3>修改 manifest 后不会立即刷新所有已安装应用</h3>
<p>浏览器可能按自己的检查和更新流程重新获取 manifest，已安装应用的名称与图标也可能需要时间更新或用户确认。开发工具能帮助查看解析结果，但不能据此承诺所有用户立即看到新图标。</p>
<p>调试时检查响应状态、JSON 格式、资源路径和浏览器应用面板中的有效值。无效字段可能被忽略并采用默认行为，文件请求成功不代表所有配置都被接受。</p>
<p>离线能力还要另行准备 Service Worker、缓存和数据策略。搜索结果里的 favicon 也不是单靠 Manifest 图标就必然更新；安装图标、浏览器标签图标和搜索引擎展示属于相关但不同的消费路径。</p>
<p>最终验证应包括实际安装、从系统入口启动、子路径导航、图标裁切和更新后的表现，同时保证没有安装的用户仍能正常使用网站。</p>`};export{e as default};