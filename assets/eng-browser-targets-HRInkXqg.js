var e={answerHtml:`<p>把构建 target 改成旧浏览器版本，不等于浏览器突然拥有所有新 API。兼容性至少要分清：代码能不能被解析，运行时有没有相应方法，以及浏览器是否具备完成这项功能的底层能力。</p>
<p>例如可选链是一种语法，Array.prototype.toSorted 是运行时方法，Web Bluetooth 又涉及浏览器、权限和设备支持。它们不能靠同一种配置全部解决。</p>
<h2>同一段源码里就有两类问题</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readName</span>(<span class="hljs-params">profile</span>) {
  <span class="hljs-keyword">return</span> profile?.<span class="hljs-property">name</span> ?? <span class="hljs-string">&#x27;匿名&#x27;</span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">sortNumbers</span>(<span class="hljs-params">values</span>) {
  <span class="hljs-keyword">return</span> values.<span class="hljs-title function_">toSorted</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);
}
</code></pre></div>
<p>在工具支持的情况下，可选链和空值合并可以转换成较旧的判断表达式。toSorted 则只是一个方法调用，语法本身并不新到无法解析；旧环境如果没有这个方法，代码仍会在运行时失败。</p>
<p>因此“产物里已经看不到 ?. ”只说明相关语法得到处理，不证明排序、网络、DOM 和其他 API 都已兼容。</p>
<h2>target 告诉转换器面向什么环境</h2>
<p>例如可以在 Vite 配置中设置一个明确目标：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vite&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">build</span>: {
    <span class="hljs-attr">target</span>: <span class="hljs-string">&#x27;chrome70&#x27;</span>,
  },
});
</code></pre></div>
<p>这只是配置语法示例，不是建议所有产品都支持该版本。工具会按其支持的转换能力生成适当代码，但仍可能有无法合理转换的语法或运行模型，不能保证任意现代程序都能转换到任意旧环境。</p>
<p>Vite 默认目标会随主要版本选定的 Baseline 范围演进，项目升级后应重新核对。生产 build.target 也不意味着开发服务器和每个第三方插件都自动采用完全相同的兼容策略。</p>
<h2>polyfill 补的是运行时实现</h2>
<p>对于能够以既有能力实现的标准方法，可以使用维护中的 polyfill 方案补充。应用还需要决定加载顺序、支持范围和注入成本，确保相关代码执行前能力已经准备好。</p>
<p>全局 polyfill 通常修改对应全局或原型；只通过导入函数提供替代能力的方案则有不同的使用方式。两者对业务代码、第三方依赖和全局环境的影响不同，不能混为一种配置。</p>
<p>对于本例中的普通数字数组，业务也可以选择复制后排序等已支持的写法。但这不代表一个简短的替代函数就完整实现了标准方法的所有稀疏数组、对象与边界语义，不能随意当作通用 polyfill 发布。</p>
<h2>有些能力不能完整模拟</h2>
<p>依赖浏览器底层权限、硬件、安全隔离或渲染机制的功能，往往不能仅通过添加 JavaScript 获得等价实现。即使存在库提供替代，也可能只是不同能力和体验的降级路径。</p>
<p>例如缺少蓝牙访问能力时，添加同名函数不能让浏览器真正控制设备；缺少某些 CSS 布局能力时，脚本模拟也可能有性能和语义差异。</p>
<p>这类功能应通过能力检测和产品降级设计处理，而不是把“有一个 polyfill 包”当成完整兼容证据。</p>
<h2>TypeScript 类型通过并不证明环境支持</h2>
<p>TypeScript 的 lib 可以让类型检查器知道某些标准 API，target 则影响相应输出语法，但类型声明不会向浏览器注入实现。</p>
<p>把 ES2023 加进类型库后，toSorted 可能不再报类型错误，旧浏览器仍可能没有这个方法。Vite 等工具对 TypeScript 的语法转换与完整类型检查又是两件事，需要看整个构建与检查链。</p>
<p>Browserslist、转换器目标、CSS 处理器和测试环境也要分别确认。只在一个文件中写了浏览器列表，不代表所有工具都会自动读取并执行同样的策略。</p>
<h2>兼容性还包括 CSS、HTML 与运行条件</h2>
<p>JavaScript 可以运行，页面仍可能因为 CSS 特性不支持而布局错误。HTML 控件、输入行为、媒体格式和网络策略，也各有自己的兼容范围。</p>
<p>某个 API 只在安全上下文中提供，或需要用户激活与权限，即使浏览器版本够新也可能调用失败。特性存在与本次调用获准，仍要分开处理。</p>
<p>特性检测通常比单纯猜 User-Agent 更可靠，但检测代码本身也必须能被目标环境解析。把新语法写在一个永远不会执行的分支中，并不能防止旧解析器在加载时就报错。</p>
<h2>怎样选择和验证目标更实际</h2>
<p>先根据真实用户设备、业务环境和维护成本定义支持范围，再决定哪些能力必须有、哪些可以增强。企业内嵌 WebView、老设备和桌面浏览器可能具有不同更新节奏，不能只看一个市场份额数字。</p>
<p>然后检查生产产物中的语法和依赖，运行关键功能，并验证缺少能力时的反馈。模拟删除一个 API 可以帮助测试降级逻辑，但不等于已经覆盖真实旧浏览器的解析器、布局和权限行为。</p>
<p>旧环境支持需要转换、运行时补充与产品取舍共同完成。设置 target 是其中一项输入，不是一份自动签发的全站兼容保证。</p>`};export{e as default};