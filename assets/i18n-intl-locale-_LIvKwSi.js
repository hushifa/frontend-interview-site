var e={answerHtml:`<h2>简答</h2>
<ul>
<li>语言、脚本、地区和时区是不同维度，Intl.Locale 按 BCP 47 解析语言标签。</li>
<li>canonicalize、maximize 和 minimize 只规范化或补全标签，不做翻译。</li>
<li>用户语言偏好和资源回退是两个过程，要和应用实际提供的资源做匹配。</li>
<li>文字方向信息要同时检测 getTextInfo() 和旧的 textInfo；locale 来自用户输入，不能用来决定权限。</li>
</ul>
<p>国际化系统里经常出现一串看似简单的字符串：<code>zh-CN</code>、<code>en-GB</code>、<code>sr-Latn</code> 或 <code>ar-EG</code>。如果把它们当普通字符串拆分，开发者很容易把语言、脚本、地区、扩展和用户偏好混在一起。例如 <code>en</code> 没有明确地区，<code>zh-Hant</code> 指定了脚本却没有指定地区，而 <code>America/Los_Angeles</code> 是时区，不是语言标签的一部分。</p>
<p><code>Intl.Locale</code> 提供了一个结构化入口，用来解析和组合 BCP 47 语言标签。它帮助应用读取语言、脚本和地区等组成部分，但它不是翻译器、不是时区对象，也不会替产品决定用户最终使用哪种语言。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> locale = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;zh-Hant-TW&#x27;</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(locale.<span class="hljs-property">language</span>); <span class="hljs-comment">// zh</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(locale.<span class="hljs-property">script</span>);   <span class="hljs-comment">// Hant</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(locale.<span class="hljs-property">region</span>);   <span class="hljs-comment">// TW</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(locale.<span class="hljs-property">baseName</span>); <span class="hljs-comment">// zh-Hant-TW</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(locale.<span class="hljs-title function_">toString</span>());
</code></pre></div>
<p>对象的属性描述标签中的语义，不代表服务器一定支持该语言，也不代表用户真的能读懂。应用仍要维护可用翻译资源和明确的 fallback 策略。</p>
<h2>语言、脚本、地区和时区是不同维度</h2>
<p>语言标签的常见组成部分包括语言（language）、脚本（script）和地区（region），还可能有变体和 Unicode 扩展：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> simplified = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;zh-Hans&#x27;</span>);
<span class="hljs-keyword">const</span> traditionalTaiwan = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;zh-Hant-TW&#x27;</span>);
<span class="hljs-keyword">const</span> calendar = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;en-US-u-ca-gregory&#x27;</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(simplified.<span class="hljs-property">language</span>, simplified.<span class="hljs-property">script</span>, simplified.<span class="hljs-property">region</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(traditionalTaiwan.<span class="hljs-property">language</span>, traditionalTaiwan.<span class="hljs-property">script</span>, traditionalTaiwan.<span class="hljs-property">region</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(calendar.<span class="hljs-property">calendar</span>); <span class="hljs-comment">// gregory（是否支持该属性取决于运行时）</span>
</code></pre></div>
<p>地区不一定等于用户当前所在地，脚本也不一定等于单一国家。<code>zh-CN</code> 和 <code>zh-TW</code> 可能使用不同的内容、词汇和日期规则；<code>sr-Latn</code> 与 <code>sr-Cyrl</code> 的主要差异是书写脚本。时区应单独保存和处理，例如 <code>Asia/Tokyo</code> 不能拼进语言标签来代替 <code>timeZone</code> 选项。</p>
<p>表单和账号设置最好分别存储：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> preferences = {
  <span class="hljs-attr">locale</span>: <span class="hljs-string">&#x27;en-GB&#x27;</span>,
  <span class="hljs-attr">timeZone</span>: <span class="hljs-string">&#x27;Europe/London&#x27;</span>,
};
</code></pre></div>
<p>这样用户在英国时区使用中文界面，或在中文界面查看纽约业务时间，都不会因为一个字符串字段被迫绑定在一起。</p>
<h2>canonicalize、maximize 和 minimize 不是翻译</h2>
<p><code>Intl.getCanonicalLocales()</code> 可以规范化一组 locale 标识，<code>Locale</code> 的 <code>maximize()</code> 和 <code>minimize()</code> 可根据运行时的语言数据补充或移除通常的脚本/地区信息：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> original = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;zh&#x27;</span>);
<span class="hljs-keyword">const</span> maximized = original.<span class="hljs-title function_">maximize</span>();
<span class="hljs-keyword">const</span> minimized = maximized.<span class="hljs-title function_">minimize</span>();

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(maximized.<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// 结果依赖运行时的 likely-subtags 数据</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(minimized.<span class="hljs-title function_">toString</span>());

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Intl</span>.<span class="hljs-title function_">getCanonicalLocales</span>([<span class="hljs-string">&#x27;EN-us&#x27;</span>, <span class="hljs-string">&#x27;zh-cn&#x27;</span>]));
</code></pre></div>
<p>最大化的结果是“根据语言数据推测一个更完整标签”，不是确认用户所在地区，也不是把 <code>zh</code> 永久改成某个产品地区。最小化则尝试移除可以推断的部分，结果同样依赖 ICU/CLDR 数据。不要把 <code>maximize()</code> 的地区当成地理定位、账单地区或法律辖区。</p>
<p>规范化后的语言标签适合用于 locale matching 和格式化器配置；业务持久化是否保留用户原始选择，取决于产品需求。若用户明确选择 <code>zh-Hant-TW</code>，不能为了节省字符串长度无条件存成 <code>zh</code>，否则可能丢失重要脚本和地区偏好。</p>
<h2>Locale 选择和资源回退是两个过程</h2>
<p>浏览器可能通过 <code>navigator.languages</code> 提供用户偏好，例如 <code>[&#x27;zh-Hant-TW&#x27;, &#x27;en-US&#x27;]</code>。应用需要把它与自己实际提供的资源列表匹配：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> supported = [<span class="hljs-string">&#x27;zh-CN&#x27;</span>, <span class="hljs-string">&#x27;en-US&#x27;</span>, <span class="hljs-string">&#x27;ja-JP&#x27;</span>];
<span class="hljs-keyword">const</span> requested = navigator.<span class="hljs-property">languages</span>;
<span class="hljs-keyword">const</span> matcher = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>);

<span class="hljs-keyword">const</span> supportedSet = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>(supported.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">tag</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(tag).<span class="hljs-property">baseName</span>));
<span class="hljs-keyword">const</span> selected = requested.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">tag</span>) =&gt;</span> {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> supportedSet.<span class="hljs-title function_">has</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(tag).<span class="hljs-property">baseName</span>);
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
}) ?? supported[<span class="hljs-number">0</span>];

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(selected);
<span class="hljs-keyword">void</span> matcher; <span class="hljs-comment">// 这里仅说明 Locale 对象不等于资源匹配器</span>
</code></pre></div>
<p>示例中的精确匹配很简单，实际产品可能需要按语言、脚本和地区逐级回退，例如先尝试 <code>zh-Hant-TW</code>，再尝试 <code>zh-Hant</code>，最后回退到默认语言。<code>Intl.Locale</code> 负责解析标签，但不会自动加载翻译文件，也不会判断某个 locale 是否存在完整文案。资源系统应明确回退顺序、缺失 key 的处理和审校状态。</p>
<p>不要用 <code>startsWith(&#x27;en&#x27;)</code> 代替标签匹配：<code>en</code>、<code>en-GB</code>、<code>en-US</code> 的地区规则可能不同，扩展和脚本也会使简单字符串前缀失去语义。对格式化器可以使用 <code>Intl</code> 的 locale negotiation；对应用翻译资源则按产品定义的支持矩阵处理。</p>
<h2>方向信息不能只靠字符串判断</h2>
<p>Intl Locale Info 提案提供文字方向信息。提案已把早期的 <code>textInfo</code> 访问器改为 <code>getTextInfo()</code> 方法，旧版运行时（如 Node 22）只有访问器，所以两种都要检测：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> locale = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;ar-EG&#x27;</span>);
<span class="hljs-keyword">const</span> info = locale.<span class="hljs-property">getTextInfo</span>?.() ?? locale.<span class="hljs-property">textInfo</span>;
<span class="hljs-keyword">const</span> direction = info?.<span class="hljs-property">direction</span> ?? <span class="hljs-string">&#x27;ltr&#x27;</span>;
<span class="hljs-variable language_">document</span>.<span class="hljs-property">documentElement</span>.<span class="hljs-property">dir</span> = direction;
</code></pre></div>
<p>能力检测是必要的，因为较新的 Locale 信息在旧浏览器或部分 WebView 中可能不存在。方向设置还要和 HTML 的 <code>lang</code>、局部 <code>dir</code>、CSS 逻辑属性、图标方向和混合数字文本一起设计；仅把 <code>dir</code> 改成 <code>rtl</code> 不能保证表单、弹窗和自定义组件正确布局。</p>
<p>语言标签的方向是默认提示，不一定代表每一段用户内容的实际方向。用户输入的阿拉伯文姓名、英文 URL 和数字可能混在同一行，需要使用适当的 Unicode 双向文本处理和局部方向标记。不能因为页面 locale 是 RTL，就把所有字符串都强制套成 RTL。</p>
<h2>扩展键不是任意配置对象</h2>
<p>语言标签可以包含 Unicode 扩展，例如日历、数字系统和小时周期：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> locale = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;th-TH-u-nu-thai-ca-buddhist&#x27;</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(locale.<span class="hljs-property">numberingSystem</span>); <span class="hljs-comment">// thai</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(locale.<span class="hljs-property">calendar</span>);        <span class="hljs-comment">// buddhist</span>
</code></pre></div>
<p>这些扩展可以影响 <code>Intl.DateTimeFormat</code> 或 <code>Intl.NumberFormat</code> 的默认行为，但应用仍可通过 formatter options 显式指定设置。不能把扩展键当成任意业务参数塞进 locale；无效或不支持的扩展可能被忽略、规范化或产生不同结果。权限、租户、货币和产品实验开关应使用独立字段。</p>
<p>如果产品允许用户选择数字系统或日历，要保存经过允许列表验证的配置，并在所有格式化器中使用同一套约定。不要因为字符串中包含 <code>u-ca-...</code>，就认为所有日期组件、服务端和导出文件都会自动采用同样的日历。</p>
<h2>SSR、缓存和安全边界</h2>
<p>Locale 解析不等于可信身份信息。<code>Accept-Language</code>、<code>navigator.languages</code> 和 URL 中的 locale 都可能被用户修改，不能用来决定权限、租户、价格或法律地区。服务端应验证用户选择，敏感业务使用账号和服务器配置确定。</p>
<p>SSR 时服务端和客户端应使用同一个已确定的 locale。服务端根据请求头得到 <code>en-US</code>，客户端又根据浏览器设置选择 <code>zh-CN</code>，会造成首屏翻译和格式化结果不一致。把 locale 作为明确的请求上下文传入渲染和 hydration，而不是依赖各自的机器默认环境。</p>
<p>缓存页面或 API 时，locale 可能是响应变化的输入，需要正确的缓存键或 <code>Vary: Accept-Language</code> 策略；公开页面和用户私有语言偏好不能错误共享。显示名称、日期和数字格式化结果也不应混入用户身份无关的共享缓存而泄露偏好信息。</p>
<h2>兼容性和验收</h2>
<p><code>Intl.Locale</code> 在现代浏览器和 Node.js 中普遍可用，但属性、方法和 ICU 数据的支持程度可能不同。使用前应按目标环境查兼容性，并对 <code>getTextInfo()</code>/<code>textInfo</code>、扩展属性和 <code>maximize()</code> 结果做能力检测。基础标签可以用 <code>Intl.getCanonicalLocales</code> 或受审校的解析库降级，但不要写一个只按连字符切分的伪解析器来处理所有 BCP 47 语法。</p>
<p>验收至少包括：</p>
<ul>
<li><code>language</code>、<code>script</code>、<code>region</code>、扩展和非法标签；</li>
<li>用户偏好与应用支持列表的回退顺序；</li>
<li>SSR、水合、语言切换和缓存键；</li>
<li>RTL 方向、混合文本、数字系统和日历扩展；</li>
<li>locale 改变时显示名称、日期、数字和排序是否一起更新；</li>
<li>不支持新属性的旧 WebView 是否仍能显示、提交和保存稳定语言代码。</li>
</ul>
<p><code>Intl.Locale</code> 的价值是把语言标签从一根难以解释的字符串变成可检查的结构。它帮助应用区分语言、脚本、地区和扩展，但不会替代翻译资源、时间处理、资源匹配或权限模型。把 locale 当作展示和格式化上下文，把业务身份和时区单独建模，后续扩展才不会互相污染。</p>`};export{e as default};