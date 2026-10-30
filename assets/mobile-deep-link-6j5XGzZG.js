var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如活动页上有个“打开 App 查看”按钮，点了要直接跳到 App 里的商品详情。最老的做法是跳转一个自定义地址，比如 <code>myapp://product?id=42</code>，App 事先在系统里注册了 <code>myapp</code> 这个 scheme，系统就把它交给 App。</p>
<p>自定义 scheme 的问题是谁都能注册。Apple 文档写明，多个 App 注册同一个 scheme 时，系统选哪个是不确定的。所以两个平台都推出了“用普通 https 链接打开 App”的方案：iOS 叫 Universal Links，网站在 <code>/.well-known/apple-app-site-association</code> 声明哪些 App 能处理哪些路径；Android 叫 App Links，网站在 <code>/.well-known/assetlinks.json</code> 写上 App 的包名和签名证书指纹，App 的 intent filter 加 <code>android:autoVerify=&quot;true&quot;</code>。系统验证通过后，点这个链接就直接进 App。</p>
<p>https 方案的好处是降级很自然。没装 App 时，Universal Links 会在默认浏览器里打开这个网址，App Links 本来就是普通网页链接，网页自己展示内容和下载按钮就行。自定义 scheme 没有这种兜底，只能靠页面自己判断有没有跳走，比如监听 <code>visibilitychange</code>，页面一直没被切到后台，就引导去下载页或应用商店。</p>
<p>要注意几点。验证文件必须用 HTTPS 提供，不能有重定向；iOS 在 Safari 里点同一个域名下的 Universal Link，会留在 Safari 里，不打开 App；App 收到链接后要校验参数，因为任何网页和 App 都能构造这样的链接。</p>
</blockquote>
<h2>自定义 URL Scheme 是怎么工作的</h2>
<p>App 在系统里登记一个前缀，比如 <code>myapp</code>。iOS 在 Xcode 的 URL Types 里声明，Android 在 intent filter 的 <code>&lt;data android:scheme=&quot;myapp&quot;&gt;</code> 里声明。之后任何地方打开以 <code>myapp:</code> 开头的地址，系统都会启动这个 App，并把完整的 URL 交给它，App 再从 URL 里解析出要打开哪个页面。</p>
<p>在 H5 里，触发它最简单的写法就是改地址：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">location.<span class="hljs-property">href</span> = <span class="hljs-string">&#x27;myapp://product?id=42&#x27;</span>;
</code></pre></div>
<p>这种写法哪里都能用，可它有两个问题。第一个是不唯一。Apple 文档说，用反向域名做标识是好习惯，但不能阻止别的 App 注册同一个 scheme，多个 App 注册了同一个 scheme 时，系统打开哪一个是不确定的，也没有办法调整。Android 的普通 deep link 也一样，可能弹出让用户选择 App 的对话框。第二个是没有结果。赋值语句不会告诉页面 App 有没有被打开，没装 App 时也没有统一的降级行为。</p>
<p>所以 Apple 文档的说法是：自定义 scheme 可以用，但强烈推荐 Universal Links。</p>
<h2>Universal Links 怎样把链接和 App 绑在一起</h2>
<p>Universal Links 用的就是普通的 https 网址，同一个 URL 网站能打开，App 也能打开。关键是“双向声明”：App 声明自己能处理哪个域名，域名也声明自己允许哪个 App 处理。</p>
<p>App 这一边，在 Xcode 的 Signing &amp; Capabilities 里加 Associated Domains，写上 <code>applinks:example.com</code>。网站这一边，在下面这个地址放一个名为 <code>apple-app-site-association</code> 的 JSON 文件，没有扩展名：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">https://example.com/.well-known/apple-app-site-association
</code></pre></div>
<p>文件内容大致是这样，<code>appIDs</code> 写“团队 ID.Bundle ID”，<code>components</code> 写哪些路径交给 App：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;applinks&quot;: {
    &quot;details&quot;: [
      {
        &quot;appIDs&quot;: [&quot;ABCDE12345.com.example.app&quot;],
        &quot;components&quot;: [
          { &quot;/&quot;: &quot;/product/*&quot; },
          { &quot;/&quot;: &quot;/help/*&quot;, &quot;exclude&quot;: true }
        ]
      }
    ]
  }
}
</code></pre></div>
<p>用户装 App 时，系统会去下载这个文件，核对 App 声明的域名。核对通过以后，用户点 <code>https://example.com/product/42</code>，系统直接把链接交给 App，不经过浏览器也不经过网站；<code>/help/</code> 开头的路径被排除了，照常在浏览器里打开。</p>
<p>这里有几个容易忽略的规定。文件必须用 <code>https://</code>、有效证书提供，不能有重定向；每个子域名都要单独写进 entitlement，并且各自提供文件。从 iOS 14、macOS 11 起，设备不再直接向你的服务器请求这个文件，而是向 Apple 管理的 CDN 请求，Apple 文档说 CDN 会在 24 小时内抓取，设备装好 App 后大约每周检查一次更新。所以改完文件不会马上在所有设备上生效，内网测试服务器 CDN 也访问不到，开发时要用文档里的 alternate mode。</p>
<h2>App Links 在 Android 上怎样验证</h2>
<p>Android 的思路一样，也是普通的 http/https 链接加域名验证。App 这一边，在 intent filter 上加 <code>android:autoVerify=&quot;true&quot;</code>：</p>
<div class="not-prose code-block"><div class="code-language">XML</div><pre><code class="hljs language-xml"><span class="hljs-tag">&lt;<span class="hljs-name">intent-filter</span> <span class="hljs-attr">android:autoVerify</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">action</span> <span class="hljs-attr">android:name</span>=<span class="hljs-string">&quot;android.intent.action.VIEW&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">category</span> <span class="hljs-attr">android:name</span>=<span class="hljs-string">&quot;android.intent.category.DEFAULT&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">category</span> <span class="hljs-attr">android:name</span>=<span class="hljs-string">&quot;android.intent.category.BROWSABLE&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">data</span> <span class="hljs-attr">android:scheme</span>=<span class="hljs-string">&quot;http&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">data</span> <span class="hljs-attr">android:scheme</span>=<span class="hljs-string">&quot;https&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">data</span> <span class="hljs-attr">android:host</span>=<span class="hljs-string">&quot;www.example.com&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">intent-filter</span>&gt;</span>
</code></pre></div>
<p>网站这一边，在 <code>https://www.example.com/.well-known/assetlinks.json</code> 放一个声明文件，写明哪个包名、哪个签名证书的 App 可以处理这个域名的所有链接：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">[
  {
    &quot;relation&quot;: [&quot;delegate_permission/common.handle_all_urls&quot;],
    &quot;target&quot;: {
      &quot;namespace&quot;: &quot;android_app&quot;,
      &quot;package_name&quot;: &quot;com.example&quot;,
      &quot;sha256_cert_fingerprints&quot;: [&quot;14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5&quot;]
    }
  }
]
</code></pre></div>
<p>在 Android 6.0（API 23）及以上的设备上，只要有一个 intent filter 带了 <code>autoVerify</code>，安装 App 时系统就会去每个声明的域名下取这个文件。验证通过后，点链接直接进 App，不会弹出选择 App 的对话框。官方文档也写明，App Links 需要设备上有 Google 服务。</p>
<p>为什么写进签名证书指纹？因为包名谁都可以起，签名证书只有开发者自己有。别的 App 就算声明了同一个域名，指纹对不上也验证不过，所以链接不会被它截走。</p>
<p>文件本身的要求和 iOS 相近：必须能通过 HTTPS 访问，<code>content-type</code> 是 <code>application/json</code>，不能有 301、302 重定向，多个域名每个都要放一份。intent filter 里也不要混进自定义 scheme，官方示例的注释写明，这样会让验证失败。</p>
<h2>没装 App 时怎样降级</h2>
<p>用 https 链接的方案，降级是系统自己完成的。Apple 文档说，用户没有装 App 时，系统在默认浏览器里打开这个 URL，由网站处理；Android 文档也说，没装 App 的用户会直接进入网站上对应的内容。所以 <code>https://example.com/product/42</code> 这个网页本身就要做好：展示商品内容，放一个“下载 App”的按钮，指向下载页或应用商店。</p>
<p>自定义 scheme 没有这种兜底，只能由页面自己猜有没有跳走。常见做法是跳转之后等一会儿，看页面有没有被切到后台。MDN 说明，移动端从浏览器切到其他 App 时，文档会触发 <code>visibilitychange</code>，<code>visibilityState</code> 变成 <code>hidden</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">openApp</span>(<span class="hljs-params">schemeUrl, fallbackUrl, wait</span>) {
  <span class="hljs-keyword">let</span> left = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">onHidden</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span>) left = <span class="hljs-literal">true</span>;
  };
  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, onHidden);
  location.<span class="hljs-property">href</span> = schemeUrl;

  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, onHidden);
    <span class="hljs-keyword">if</span> (!left) location.<span class="hljs-property">href</span> = fallbackUrl;
  }, wait);
}
</code></pre></div>
<p>这段代码的意思是：跳转 scheme 后，如果等待时间内页面一直可见，就认为没打开 App，转到下载页。它只是一种推测。用户在系统弹窗上犹豫了很久，或者 App 打开得慢，都可能被误判成“没装”。所以能用 Universal Links 和 App Links 的地方优先用它们，scheme 只作为补充。</p>
<h2>Universal Links 什么时候不会打开 App</h2>
<p>Apple 文档写了一条很容易踩的规则：用户在 Safari 里浏览你的网站，点了同一个域名下的 Universal Link，系统会留在 Safari 里打开，因为这时用户多半想继续用浏览器；点的是另一个域名的 Universal Link，才会打开 App。</p>
<p>另外，App 自己用 <code>UIApplication</code> 的 <code>open</code> 等方法打开指向自己网站的 Universal Link，也不会进入 App。</p>
<h2>唤起以后，App 要做什么</h2>
<p>不管哪种方式，App 拿到的都是一个 URL，要自己解析参数再跳到对应页面。iOS 的自定义 scheme 由 App delegate 的 <code>application(_:open:options:)</code> 收到，Universal Link 则通过 user activity 交给 App。Apple 文档特别提醒，URL scheme 是一个潜在的攻击入口，要校验所有参数、丢掉格式不对的 URL，也不要允许外部链接直接执行删除内容、读取敏感信息这类操作。Android 文档提到，App Links 要求验证域名归属，就是为了防止别的 App 截走链接。</p>
<p>网页和 App 之间的其他通信，比如网页调用原生的分享、支付，见<a href="/questions/mobile-hybrid-jsbridge/">《Hybrid 开发是什么？JSBridge 的 URL Scheme 拦截和注入对象有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么配置了 Universal Links，点链接还是在浏览器里打开？</strong></p>
<blockquote>
<p>先看是不是在 Safari 里点了同域名的链接，这种情况系统本来就留在 Safari。再查 <code>apple-app-site-association</code>：要放在 <code>/.well-known/</code> 下，用 HTTPS、有效证书，不能有重定向，<code>appIDs</code> 要和 App 的团队 ID、Bundle ID 对上。从 iOS 14 起设备通过 Apple 的 CDN 取这个文件，Apple 说 CDN 在 24 小时内抓取，所以刚改完不生效也正常。</p>
</blockquote>
<p><strong>App Links 和普通的 Android deep link 有什么区别？</strong></p>
<blockquote>
<p>普通 deep link 可以用自定义 scheme，也可以用 http 链接，但没有验证，多个 App 都声明时系统会弹出选择框。App Links 只用 http/https，加 <code>autoVerify</code>，并要求网站上的 <code>assetlinks.json</code> 写对包名和签名证书指纹。验证通过后点击直接进 App，别的 App 截不走。它要求 Android 6.0 以上、设备有 Google 服务。</p>
</blockquote>
<p><strong>为什么不能只靠自定义 scheme？</strong></p>
<blockquote>
<p>它不唯一，Apple 文档说多个 App 注册同一个 scheme 时，系统打开哪个是不确定的。它也没有结果反馈，没装 App 时页面只能靠计时和 <code>visibilitychange</code> 去猜，容易误判。https 链接方案既能验证归属，又在没装 App 时自然打开网页，所以两个平台都推荐它。</p>
</blockquote>`};export{e as default};