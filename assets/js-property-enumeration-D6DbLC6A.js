var e={answerHtml:`<p>对象里“有哪些属性”不是一个只有单一答案的问题。某个属性可能在对象自身，也可能在原型上；键可以是字符串或 Symbol；属性还可以被标记为不可枚举。</p>
<p>Object.keys、for...in、Reflect.ownKeys 选择的范围不同，所以同一个对象得到不同结果是正常的。调用前先确定你需要的是业务记录字段、继承能力，还是完整的自身属性清单。</p>
<h3>用一个对象同时观察三种属性维度</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;内部标记&#x27;</span>);
<span class="hljs-keyword">const</span> object = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>({ <span class="hljs-attr">inherited</span>: <span class="hljs-number">1</span> });
object.<span class="hljs-property">visible</span> = <span class="hljs-number">2</span>;
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(object, <span class="hljs-string">&#x27;hidden&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">3</span> });
object[key] = <span class="hljs-number">4</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(object).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// visible</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">ownKeys</span>(object).<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(object, <span class="hljs-string">&#x27;inherited&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>visible 是自身、可枚举的字符串属性。hidden 也是自身字符串属性，但 defineProperty 新建它时没有设置 enumerable:true，因此不可枚举。key 是自身可枚举的 Symbol 属性。inherited 在原型上，不属于对象自身。</p>
<p>Object.keys 只选中 visible；Reflect.ownKeys 包含 visible、hidden 和 Symbol 键，却不会加上原型中的 inherited。因此“ownKeys 更全面”指它包含完整的自身键，不是把整个原型链都展开。</p>
<h3>常用 API 分别覆盖什么范围</h3>
<table><thead><tr><th>API 或语法</th><th>自身属性</th><th>继承属性</th><th>字符串键</th><th>Symbol 键</th><th>包含不可枚举属性</th></tr></thead><tbody><tr><td>Object.keys / values / entries</td><td>是</td><td>否</td><td>是</td><td>否</td><td>否</td></tr><tr><td>for...in</td><td>是</td><td>是</td><td>是</td><td>否</td><td>否</td></tr><tr><td>Object.getOwnPropertyNames</td><td>是</td><td>否</td><td>是</td><td>否</td><td>是</td></tr><tr><td>Object.getOwnPropertySymbols</td><td>是</td><td>否</td><td>否</td><td>是</td><td>是</td></tr><tr><td>Reflect.ownKeys</td><td>是</td><td>否</td><td>是</td><td>是</td><td>是</td></tr><tr><td>对象展开、Object.assign 的来源属性</td><td>是</td><td>否</td><td>是</td><td>是</td><td>否</td></tr></tbody></table>
<p>表中的 for...in 还要考虑同名属性遮蔽、遍历过程中修改对象等规则，并不是把每层的可枚举键数组直接拼起来。数组的 for...of 则是另一个概念：它使用迭代协议取得元素值，不是逐个枚举普通对象属性名。</p>
<p>如果需要完整的自身描述符，Object.getOwnPropertyDescriptors 可以同时提供键对应的 value/get/set 及属性标志。拿到这些信息不等于已经复制了对象的内部槽或类私有状态。</p>
<h3>属性不可枚举，不代表不能访问</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> item = {};
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(item, <span class="hljs-string">&#x27;secret&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">7</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(item.<span class="hljs-property">secret</span>); <span class="hljs-comment">// 7</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(item, <span class="hljs-string">&#x27;secret&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;secret&#x27;</span> <span class="hljs-keyword">in</span> item); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(item).<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>enumerable 控制它是否参加相应的枚举操作，不控制访问权限。Symbol 键也不是秘密字段：Reflect.ownKeys 或 Object.getOwnPropertySymbols 仍然可以发现它们。</p>
<p>Object.hasOwn 检查属性是否属于自身，不会把原型上同名属性算进来；in 则会沿原型链检查。比起直接调用 object.hasOwnProperty，Object.hasOwn 还避免了对象没有该方法或自己覆盖了同名字段的问题。</p>
<h3>原型上的同名字段可能被非枚举属性遮住</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> prototype = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;原型名字&#x27;</span>, <span class="hljs-attr">other</span>: <span class="hljs-number">1</span> };
<span class="hljs-keyword">const</span> child = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(prototype);
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(child, <span class="hljs-string">&#x27;name&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;自身名字&#x27;</span> });

<span class="hljs-keyword">const</span> keys = [];
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">in</span> child) keys.<span class="hljs-title function_">push</span>(key);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(keys.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// other</span>
</code></pre></div>
<p>child.name 自身不可枚举，所以不会被输出；原型上的可枚举 name 也不会绕过这个同名遮蔽重新出现。因此需要分析具体属性关系，不能只说“for...in 把所有原型上的可枚举属性都无条件列出来”。</p>
<p>在普通业务记录转换中，Object.entries 往往比 for...in 更贴近“只处理自己提供的字段”的意图。如果确实使用 for...in，又只想处理自身字段，应明确通过 Object.hasOwn 过滤。</p>
<h3>普通对象的顺序不是纯粹的插入顺序</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> record = {};
record.<span class="hljs-property">z</span> = <span class="hljs-number">1</span>;
record[<span class="hljs-number">10</span>] = <span class="hljs-number">2</span>;
record[<span class="hljs-number">2</span>] = <span class="hljs-number">3</span>;
record[<span class="hljs-string">&#x27;01&#x27;</span>] = <span class="hljs-number">4</span>;
record.<span class="hljs-property">a</span> = <span class="hljs-number">5</span>;
<span class="hljs-keyword">const</span> marker = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;标记&#x27;</span>);
record[marker] = <span class="hljs-number">6</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(record).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 2,10,z,01,a</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">ownKeys</span>(record).<span class="hljs-title function_">at</span>(-<span class="hljs-number">1</span>) === marker); <span class="hljs-comment">// true</span>

<span class="hljs-keyword">delete</span> record.<span class="hljs-property">z</span>;
record.<span class="hljs-property">z</span> = <span class="hljs-number">7</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(record).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 2,10,01,a,z</span>
</code></pre></div>
<p>普通对象自身键的常见顺序是：属于数组索引形式的字符串键按数值升序；其他字符串键按建立顺序；Symbol 键再按建立顺序。&#x27;01&#x27; 不是与 &#x27;1&#x27; 相同的索引形式，所以保留在普通字符串键的那一组。</p>
<p>更新已有普通字符串属性通常不改变其位置；删除后重新建立，才成为这一组中的新项。Proxy 的 ownKeys、自身对象的特殊内部行为和原型链遍历还可能涉及其他规则，所以要先限定对象种类与使用的 API。</p>
<p>如果业务必须按插入顺序管理任意键，Map 的语义通常更明确，不必把对象键顺序当成队列或排序模型。</p>
<h3>拿键、读值、复制和序列化不是同一个操作</h3>
<p>对普通对象，Object.keys 只列键，不需要执行对应 getter；Object.values、Object.entries 和对象展开读取值时，则可能执行 getter。面对 Proxy，枚举还可能触发 ownKeys、getOwnPropertyDescriptor 等 trap，不能把这些操作都当成纯粹读取内存。</p>
<p>JSON.stringify 也不是 Reflect.ownKeys 的序列化版本。它会按 JSON 规则过滤和转换内容，可能调用 toJSON，通常不会保留 Symbol 键、不可枚举属性或全部继承行为。</p>
<p>因此需要导出用户资料时，最好按明确字段映射；需要诊断对象时，再使用更完整的反射接口；需要复制普通属性描述符时，按描述符处理。把所有场景统一成一个 for...in，最容易把范围差异隐藏起来。</p>`};export{e as default};