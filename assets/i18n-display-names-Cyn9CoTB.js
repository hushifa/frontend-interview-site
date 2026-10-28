var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Intl.DisplayNames 按 type 把语言、地区、货币等代码转换成本地化名称。</li>
<li>显示名称依赖运行时的国际化数据，不能用作协议、主键或长期快照。</li>
<li>fallback 控制无法识别的代码返回代码本身还是 undefined。</li>
<li>同样配置的实例要复用；SSR 时服务端和客户端要使用一致的 locale。</li>
</ul>
<p>设置页面常需要显示“中文（简体）”“日本”“美元”或“拉丁文字”。直接维护一张只包含中文和英文的字典，很快会遇到地区差异、别名、脚本名称和翻译缺失问题。<code>Intl.DisplayNames</code> 可以根据 locale 和类型，把标准代码转换成用户语言中的显示名称：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> zh = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span> });
<span class="hljs-keyword">const</span> en = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> });
<span class="hljs-keyword">const</span> currency = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;de-DE&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;currency&#x27;</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(zh.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;fr&#x27;</span>));       <span class="hljs-comment">// 法语</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(en.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;JP&#x27;</span>));       <span class="hljs-comment">// Japan</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(currency.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;EUR&#x27;</span>)); <span class="hljs-comment">// Euro（实际标点和大小写由运行时决定）</span>
</code></pre></div>
<p>它处理的是“代码到本地化名称”的展示，不负责验证代码是否被业务允许，也不负责把名称反向解析成唯一代码。代码应来自明确的数据模型，例如 BCP 47 语言标签、ISO 3166 地区代码或 ISO 4217 货币代码；不要把用户输入的任意文字直接当作可信标准代码。</p>
<h2>type 决定代码怎样解释</h2>
<p>构造器的 <code>type</code> 是必要的语义边界。同一个字符串在不同类型下可能有不同含义：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> language = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span> });
<span class="hljs-keyword">const</span> region = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> });
<span class="hljs-keyword">const</span> script = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;script&#x27;</span> });
<span class="hljs-keyword">const</span> currency = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;currency&#x27;</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(language.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;zh-Hant&#x27;</span>)); <span class="hljs-comment">// 繁体中文</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(region.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;TW&#x27;</span>));       <span class="hljs-comment">// 台湾（Node 22 实测，名称随 CLDR 数据变化，产品可能需要覆盖）</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(script.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;Latn&#x27;</span>));      <span class="hljs-comment">// 拉丁文</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(currency.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;CNY&#x27;</span>));     <span class="hljs-comment">// 人民币</span>
</code></pre></div>
<p>常见类型包括 <code>language</code>、<code>region</code>、<code>script</code>、<code>currency</code>、<code>calendar</code> 和 <code>dateTimeField</code>（后两者自 ES2022 起是标准类型）。每种类型接受的代码格式不同，不能把地区代码当语言代码，也不能把货币符号 <code>$</code> 当 ISO 4217 代码。具体类型和浏览器版本应以目标环境的 Intl 文档为准。</p>
<p>语言显示名称通常接受 BCP 47 风格的语言标签，但标签的规范化和可识别程度由 Intl 实现处理。<code>zh-CN</code>、<code>zh-Hans</code> 和 <code>zh</code> 可能得到不同或相同的结果，不能用结果字符串判断它们是否是同一个业务语言。业务应保存原始的标准代码和自己的产品策略，显示名称只作为视图。</p>
<h2>结果不是稳定的协议文本</h2>
<p>显示名称来自运行时的国际化数据，通常与 ICU/CLDR 数据和浏览器或 Node.js 版本有关。同一个代码在不同版本中可能出现大小写、别名、地区政治名称或标点差异。不要把 <code>displayNames.of(code)</code> 的结果写进 API 协议、数据库唯一键、缓存键或快照测试的长期契约。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> display = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;fr-FR&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> });
<span class="hljs-keyword">const</span> label = display.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;DE&#x27;</span>);

<span class="hljs-comment">// 存储和提交仍使用 DE，label 只用于当前界面。</span>
<span class="hljs-keyword">const</span> option = { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;DE&#x27;</span>, label };
</code></pre></div>
<p>如果产品需要固定文案，例如法律条款、账单历史或导出文件，应在需求中决定是否锁定翻译资源和数据版本，而不是依赖用户当前运行时的名称。面向用户的实时设置列表则可以使用 Intl，但要接受名称随 locale 和运行时更新的事实。</p>
<h2>fallback 和非法输入要明确处理</h2>
<p><code>fallback</code> 可以控制无法识别代码时返回代码本身还是 <code>undefined</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> names = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, {
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span>,
  <span class="hljs-attr">fallback</span>: <span class="hljs-string">&#x27;code&#x27;</span>,
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(names.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;xx-unknown&#x27;</span>)); <span class="hljs-comment">// xx (UNKNOWN)</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span>, <span class="hljs-attr">fallback</span>: <span class="hljs-string">&#x27;none&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;XX&#x27;</span>)); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>注意第一行：<code>xx-unknown</code> 语法上是合法标签，实现会按子标签拼出名称，不会走 fallback。fallback 只在实现没有该代码的数据时生效，不能用它判断代码是否“真实存在”。</p>
<p><code>fallback: &#x27;code&#x27;</code> 不是把任意输入变成安全的可见文本。服务端返回的代码仍应先做格式和允许列表校验，显示到 HTML 时使用文本节点或框架的安全文本绑定。不要因为它“看起来像语言标签”就把未经验证的字符串拼接到 <code>innerHTML</code>、URL 或日志查询语句中。</p>
<p>对于无法识别的代码，产品可以显示原代码、统一的“未知”文案或直接隐藏选项。选择哪一种取决于是否需要诊断数据；不要在不同页面随机采用多种回退，导致用户无法理解为什么同一个选项有时消失。</p>
<h2>一个 formatter 实例可以复用</h2>
<p>构造 <code>Intl.DisplayNames</code> 会绑定 locale、type 和选项。展示大量列表时，应复用相同配置的实例，避免在每个渲染项中重复创建；切换语言或类型时再重新构造：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createLanguageOptions</span>(<span class="hljs-params">codes, locale</span>) {
  <span class="hljs-keyword">const</span> formatter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(locale, {
    <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span>,
    <span class="hljs-attr">fallback</span>: <span class="hljs-string">&#x27;code&#x27;</span>,
  });

  <span class="hljs-keyword">return</span> codes.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">code</span>) =&gt;</span> ({
    <span class="hljs-attr">value</span>: code,
    <span class="hljs-attr">label</span>: formatter.<span class="hljs-title function_">of</span>(code) ?? code,
  }));
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">createLanguageOptions</span>([<span class="hljs-string">&#x27;en&#x27;</span>, <span class="hljs-string">&#x27;ja&#x27;</span>, <span class="hljs-string">&#x27;zh-Hans&#x27;</span>], <span class="hljs-string">&#x27;zh-CN&#x27;</span>));
</code></pre></div>
<p>复用 formatter 不等于可以缓存最终 label 永远不变。locale、用户偏好、产品翻译覆盖和运行时升级都可能改变显示结果。列表排序也应在显示 locale 下用 <code>Intl.Collator</code>，不要用代码顺序或当前名称的简单 Unicode 排序代替业务要求。</p>
<h2>SSR 和水合必须使用一致环境</h2>
<p>服务端用一种 locale 生成 <code>&lt;option&gt;</code>，浏览器首次渲染时却采用另一种 locale，可能产生文本不一致、布局变化或 hydration 警告。服务端和客户端应明确传递用户 locale、fallback locale、时区和国际化数据策略：</p>
<ul>
<li>通过请求、用户配置或路由确定 locale，不依赖部署机器默认语言；</li>
<li>服务端渲染和客户端首次计算使用同一个 locale 与 type；</li>
<li>用户在页面加载后切换语言时，显式重新格式化显示名称；</li>
<li>不把显示名称放进 URL 或表单 value，提交仍使用标准代码；</li>
<li>如果运行时 ICU 数据不完整，预先测试缺失类型和 fallback 行为。</li>
</ul>
<p>Node.js 的 ICU 构建、浏览器版本和测试环境可能提供不同的国际化数据。快照测试不应把所有标点和空格锁死；可以断言代码、非空结果、主要语言语义和无障碍名称，具体文案差异由对应 locale 的审校和兼容性测试负责。</p>
<h2>语言名称与用户选择仍需要产品决策</h2>
<p><code>Intl.DisplayNames</code> 只提供名称生成，不替你决定语言列表：</p>
<ul>
<li><code>en</code>、<code>en-GB</code> 和 <code>en-US</code> 是否在产品中分开，取决于内容和地区策略；</li>
<li><code>zh-Hans</code> 与 <code>zh-CN</code> 的名称显示方式可能不同，不能仅靠字符串相等合并；</li>
<li>地区名称可能涉及政治、地区和用户偏好的命名差异，需要产品和本地化团队确认；</li>
<li>货币名称不是汇率，也不是金额格式，金额仍需用 <code>Intl.NumberFormat</code> 并显式指定 currency；</li>
<li>脚本名称不代表文本已经能正确排版，字体、方向和分词仍要另外测试。</li>
</ul>
<p>对于语言选择器，最好展示本地名称与当前界面名称的组合，例如“Deutsch — German”，让用户能找到自己的语言；但不要把显示名称当作稳定 key，也不要让名称变化导致已保存的语言代码失效。</p>
<h2>兼容性与验收</h2>
<p><code>Intl.DisplayNames</code> 是较新的 Intl 能力，目标浏览器、WebView 和 Node.js 版本的支持需要查兼容性数据并实际测试。可以用 <code>typeof Intl.DisplayNames === &#x27;function&#x27;</code> 做能力检测，降级到受审校的静态字典或显示标准代码；降级字典也应明确版本和维护来源，不能随便写几条翻译冒充完整国际化。</p>
<p>验收时至少覆盖：</p>
<ul>
<li>语言、地区、脚本和货币的合法及未知代码；</li>
<li>中文、英文、RTL locale 和长名称下的布局与可访问名称；</li>
<li>locale 切换、SSR 首屏、水合和浏览器 ICU 数据差异；</li>
<li>显示名称变化时，表单提交值和 URL 中的稳定代码不变；</li>
<li>fallback、空结果、重复 label 和排序规则符合产品约定。</li>
</ul>
<p><code>Intl.DisplayNames</code> 适合把标准代码转成用户能读懂的本地化名称，但它的结果是展示层数据。把代码保存在业务模型里，把名称交给 locale-aware formatter，再为不支持或不完整的运行时准备清晰降级，才能同时保证准确性、可维护性和跨环境一致性。</p>`};export{e as default};