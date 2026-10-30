var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个报表页要根据配置显示折线图、柱状图或饼图。如果每个用到图表的地方都写 <code>if (type === &#x27;line&#x27;) new LineChart() else if ...</code>，加一种图表就得改很多处。工厂模式是把这段判断收进一个 <code>createChart(type, data)</code> 函数，调用方只管传类型，不用知道具体是哪个类。</p>
<p>适配器模式解决的是接口对不上的问题。老接口返回 <code>user_name</code>，新接口返回 <code>profile.name</code>，页面组件只想要 <code>{ name, age }</code>。适配器就是中间那层转换函数，把各种来源的数据转成组件期望的格式，组件本身不用改。</p>
<p>两者的区别在于时机和目的。工厂关心的是“创建哪个对象”，发生在对象诞生时；适配器关心的是“已有的东西怎样配上现在的接口”，发生在使用已有对象或数据时。</p>
<p>要注意，类型只有一两种时直接 <code>new</code> 更清楚，不必加工厂；适配器最好放在数据进入应用的边界上，比如请求层，不要散落在各个组件里。</p>
</blockquote>
<h2>用工厂按类型创建对象</h2>
<p>下面用一张映射表代替 if-else，<code>createChart</code> 按类型名找到对应的类再创建实例：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">LineChart</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">data</span>) { <span class="hljs-variable language_">this</span>.<span class="hljs-property">data</span> = data; }
  <span class="hljs-title function_">render</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-string">\`折线图：<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.data.length}</span> 个点\`</span>; }
}
<span class="hljs-keyword">class</span> <span class="hljs-title class_">BarChart</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">data</span>) { <span class="hljs-variable language_">this</span>.<span class="hljs-property">data</span> = data; }
  <span class="hljs-title function_">render</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-string">\`柱状图：<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.data.length}</span> 根柱子\`</span>; }
}

<span class="hljs-keyword">const</span> chartTypes = { <span class="hljs-attr">line</span>: <span class="hljs-title class_">LineChart</span>, <span class="hljs-attr">bar</span>: <span class="hljs-title class_">BarChart</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createChart</span>(<span class="hljs-params">type, data</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title class_">Chart</span> = chartTypes[type];
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Chart</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`不支持的图表类型：<span class="hljs-subst">\${type}</span>\`</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Chart</span>(data);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">createChart</span>(<span class="hljs-string">&#x27;line&#x27;</span>, [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]).<span class="hljs-title function_">render</span>()); <span class="hljs-comment">// 折线图：3 个点</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">createChart</span>(<span class="hljs-string">&#x27;bar&#x27;</span>, [<span class="hljs-number">5</span>, <span class="hljs-number">8</span>]).<span class="hljs-title function_">render</span>()); <span class="hljs-comment">// 柱状图：2 根柱子</span>

<span class="hljs-comment">// 两个后端返回的用户数据结构不同</span>
<span class="hljs-keyword">const</span> fromOldApi = { <span class="hljs-attr">user_name</span>: <span class="hljs-string">&#x27;张三&#x27;</span>, <span class="hljs-attr">user_age</span>: <span class="hljs-string">&#x27;28&#x27;</span> };
<span class="hljs-keyword">const</span> fromNewApi = { <span class="hljs-attr">profile</span>: { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;李四&#x27;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">32</span> } };

<span class="hljs-keyword">const</span> adapters = {
  <span class="hljs-attr">old</span>: <span class="hljs-function">(<span class="hljs-params">raw</span>) =&gt;</span> ({ <span class="hljs-attr">name</span>: raw.<span class="hljs-property">user_name</span>, <span class="hljs-attr">age</span>: <span class="hljs-title class_">Number</span>(raw.<span class="hljs-property">user_age</span>) }),
  <span class="hljs-attr">new</span>: <span class="hljs-function">(<span class="hljs-params">raw</span>) =&gt;</span> ({ <span class="hljs-attr">name</span>: raw.<span class="hljs-property">profile</span>.<span class="hljs-property">name</span>, <span class="hljs-attr">age</span>: raw.<span class="hljs-property">profile</span>.<span class="hljs-property">age</span> }),
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(adapters.<span class="hljs-title function_">old</span>(fromOldApi)); <span class="hljs-comment">// { name: &#x27;张三&#x27;, age: 28 }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(adapters.<span class="hljs-title function_">new</span>(fromNewApi)); <span class="hljs-comment">// { name: &#x27;李四&#x27;, age: 32 }</span>
</code></pre></div>
<p>调用 <code>createChart</code> 的代码拿到的对象都有 <code>render</code> 方法，它不需要知道背后是 <code>LineChart</code> 还是 <code>BarChart</code>。新增饼图时，写一个 <code>PieChart</code> 类再往 <code>chartTypes</code> 里加一项就行，所有调用方都不用动。</p>
<p>为什么找不到类型时要抛错？因为配置里拼错了类型名，如果默默返回 <code>undefined</code>，错误会推迟到调用 <code>render</code> 时才暴露，报错信息也看不出原因。</p>
<p>前端里很多地方都是工厂的思路：<code>document.createElement(&#x27;div&#x27;)</code> 按标签名创建不同的元素，React 的 <code>createElement</code> 按传入的类型创建元素，低代码平台按 JSON 配置里的 <code>type</code> 渲染对应的组件。</p>
<h2>用适配器统一数据格式</h2>
<p>上面例子的后半段就是两个适配器。老接口的年龄是字符串，新接口的字段嵌在 <code>profile</code> 里，经过适配后都变成 <code>{ name, age }</code>，页面组件只认这一种结构。</p>
<p>适配器放在哪里最合适？放在请求函数里，接口一返回就转换。这样后端字段改名时，只需改适配器一处；如果组件里到处直接读 <code>raw.user_name</code>，改名就要全局搜索替换。</p>
<p>另一种常见用法是包装第三方库。比如项目里同时用过两个埋点 SDK，一个叫 <code>track(event, data)</code>，一个叫 <code>logEvent({ name, params })</code>，可以写一个统一的 <code>report(name, data)</code>，内部按当前 SDK 调用对应的方法。以后换 SDK，业务代码不受影响。</p>
<h2>工厂和适配器容易和什么混淆</h2>
<p>工厂和策略模式都常用映射表，区别在于表里放的东西。工厂表里是“怎样创建对象”，返回的是一个实例；策略表里是“怎样完成一件事”，比如不同的校验规则，见<a href="/questions/pattern-strategy-proxy/">《策略模式和代理模式分别解决什么问题？前端怎样使用？》</a>。</p>
<p>适配器和代理、装饰器都是包一层，区别在于接口变不变。适配器会把接口改成另一个样子；代理和装饰器保持接口不变，只是在调用前后加控制或功能，见<a href="/questions/pattern-decorator/">《装饰器模式是什么？和高阶函数、高阶组件有什么关系？》</a>。</p>
<h2>常见追问</h2>
<p><strong>工厂函数和构造函数有什么区别？</strong></p>
<blockquote>
<p>构造函数要用 <code>new</code> 调用，返回的一定是这个类的实例。工厂函数是普通函数，内部决定创建哪个类，甚至可以返回缓存的对象或普通对象字面量，调用方不需要知道细节，也不用写 <code>new</code>。</p>
</blockquote>
<p><strong>后端字段名和前端不一致，一定要写适配器吗？</strong></p>
<blockquote>
<p>字段少、只在一处用时，直接在用的地方取值也可以。字段多、多个页面共用、或者后端还会调整时，在请求层统一转换更省事，也方便写类型定义。</p>
</blockquote>
<p><strong>适配器会不会让代码变复杂？</strong></p>
<blockquote>
<p>会多一层，但这层换来的是隔离：外部接口的变化只影响适配器。如果外部接口很稳定，又只有一个使用方，就没必要加。</p>
</blockquote>`};export{e as default};