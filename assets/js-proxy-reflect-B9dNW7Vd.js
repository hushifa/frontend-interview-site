var e={answerHtml:`<p>Proxy 可以在对象被读取、写入、删除、枚举等操作发生时插入逻辑。它不是提前复制对象，也不是为每个属性安装一对 getter/setter，而是为目标对象建立一个代理入口，通过 handler 中的 trap 拦截对应内部操作。</p>
<p>常见用途包括开发期校验、访问记录、惰性包装以及响应式追踪。不过“能拦截 get/set”与“已经做出了完整响应式系统”之间还有很大距离。</p>
<h3>一个记录读取并校验价格的代理</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> reads = [];
<span class="hljs-keyword">const</span> target = {
  <span class="hljs-attr">price</span>: <span class="hljs-number">10</span>,
  <span class="hljs-keyword">get</span> <span class="hljs-title function_">total</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">price</span> * <span class="hljs-number">2</span>;
  },
};

<span class="hljs-keyword">const</span> product = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(target, {
  <span class="hljs-title function_">get</span>(<span class="hljs-params">object, key, receiver</span>) {
    reads.<span class="hljs-title function_">push</span>(<span class="hljs-title class_">String</span>(key));
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">get</span>(object, key, receiver);
  },
  <span class="hljs-title function_">set</span>(<span class="hljs-params">object, key, value, receiver</span>) {
    <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;price&#x27;</span> &amp;&amp; (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(value) || value &lt; <span class="hljs-number">0</span>)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;价格必须是非负有限数值&#x27;</span>);
    }
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">set</span>(object, key, value, receiver);
  },
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(product.<span class="hljs-property">total</span>); <span class="hljs-comment">// 20</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(reads.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// total,price</span>
product.<span class="hljs-property">price</span> = <span class="hljs-number">12</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(target.<span class="hljs-property">price</span>); <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(product === target); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>读取 product.total 先进入 get trap。随后 Reflect.get 找到 total 的 getter，并把 receiver，也就是这次读取的接收者，作为 getter 的 this。getter 中的 this.price 又经过代理，因此记录了 total 和 price 两次读取。</p>
<p>这个例子只记录访问和校验某项赋值，没有实现订阅、更新通知或批处理。数组 reads 本身也会不断增长，只适合演示，不应不加限制地作为长期运行的日志容器。</p>
<h3>为什么不直接返回 target[key]</h3>
<p>如果在 get trap 中写 <code>return object[key]</code>，total 的 getter 会以原 target 为 this。它内部读取 this.price 就直接读原对象，不再经过代理，因此可能漏掉依赖追踪。</p>
<p>receiver 也不一定永远是代理本身。例如一个对象以该代理为原型，读取继承 getter 时，receiver 可以是那个派生对象。使用 Reflect.get(target, key, receiver) 能保留普通属性访问应有的接收者关系。</p>
<p>Reflect.set 的 receiver 同样会影响 setter 的 this，以及相应属性最终应定义到哪里。只写 <code>target[key] = value; return true</code>，容易绕过这些语义，还可能把一个失败赋值谎报为成功。</p>
<p>Reflect 方法不是“绕过所有代理的魔法出口”。如果把代理本身又传回 Reflect.get，仍然可能再次进入 trap，造成递归。常见转发写法把传入的原 target 交给 Reflect，同时保留 receiver。</p>
<h3>不同语法会触发不同操作</h3>
<table><thead><tr><th>行为</th><th>常见相关 trap</th></tr></thead><tbody><tr><td><code>proxy.name</code></td><td>get</td></tr><tr><td><code>proxy.name = value</code></td><td>set，具体过程还可能涉及定义属性</td></tr><tr><td><code>delete proxy.name</code></td><td>deleteProperty</td></tr><tr><td><code>&#x27;name&#x27; in proxy</code></td><td>has</td></tr><tr><td>Reflect.ownKeys(proxy)</td><td>ownKeys</td></tr><tr><td>Object.getOwnPropertyDescriptor(proxy, key)</td><td>getOwnPropertyDescriptor</td></tr><tr><td>Object.defineProperty(proxy, key, descriptor)</td><td>defineProperty</td></tr><tr><td>调用或构造一个可调用/可构造目标的代理</td><td>apply、construct</td></tr></tbody></table>
<p>Object.keys 不只需要键列表，还要判断自身描述符与可枚举性，因此可能同时涉及 ownKeys 和 getOwnPropertyDescriptor。对象展开还要继续读取属性值。一次高层语法对应多个内部步骤，是设计代理逻辑时容易漏掉的地方。</p>
<p>目标本身不可调用时，单纯添加 apply trap 不会把普通对象变成函数；不可构造的目标也不会仅因提供 construct 就获得构造能力。代理仍必须服从目标所能支持的基本操作种类。</p>
<h3>trap 不能随意违背对象不变量</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> locked = {};
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(locked, <span class="hljs-string">&#x27;id&#x27;</span>, {
  <span class="hljs-attr">value</span>: <span class="hljs-number">7</span>,
  <span class="hljs-attr">writable</span>: <span class="hljs-literal">false</span>,
  <span class="hljs-attr">configurable</span>: <span class="hljs-literal">false</span>,
});

<span class="hljs-keyword">const</span> proxy = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(locked, {
  <span class="hljs-title function_">get</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-number">8</span>;
  },
});

<span class="hljs-keyword">try</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(proxy.<span class="hljs-property">id</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p>id 是不可配置、不可写的自身数据属性，代理不能把读取结果任意改成另一个值。浏览器会检查这些不变量，违背时抛错。</p>
<p>类似地，ownKeys 不能随意漏掉不可配置属性；不可扩展目标还会限制报告的键集合。set 等 trap 也有返回值与不变量约束，严格模式下报告失败的赋值会表现为异常。</p>
<p>因此实现“虚拟属性”“只读对象”等方案时，要同时考虑目标的描述符和扩展状态，不能只实现几个最常见的读取分支。</p>
<h3>为什么空代理包住 Map 也可能不能正常用</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>(), {});
<span class="hljs-keyword">try</span> {
  values.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">1</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p>Map 方法要求 this 具备相应内部槽，而代理本身不是拥有那些 Map 内部槽的原对象。普通方法调用把代理作为 this，因此即使 handler 为空，也不能把它当成对所有内置对象完全透明的包装。</p>
<p>依赖类私有元素的方法也可能因接收者不具备正确私有品牌而失败。把特定方法绑定到原目标可以解决部分接收者问题，但会改变函数身份和 this 行为，内部访问还可能绕过预期追踪。不能不分析对象类型就把所有函数自动 bind，然后宣称得到了通用代理。</p>
<h3>完整系统还要处理身份、深层结构与生命周期</h3>
<p>代理和原对象不是同一个身份，放进 Map、Set 或用于严格比较时应明确使用哪一方。直接修改原 target 不会凭空经过代理的 set trap，所以把原对象随处泄漏，会破坏入口校验或追踪约定。</p>
<p>普通代理也不会自动递归包装所有嵌套对象。需要深层追踪时，通常要维护原对象到代理的缓存，避免同一个对象每次读取都生成新代理；还要区分属性新增、更新、删除、数组 length 和集合内部变更等操作。</p>
<p>Proxy.revocable 可以提供撤销后的不可用代理，但撤销并不会取消已经发出的请求，也不会删除外部代码早已持有的原对象引用。代理适合管理受控入口，不能独自作为运行不可信代码的完整沙箱。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/get">MDN · Reflect.get()</a>、<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get">MDN · get trap 的不变量</a>。</p>`};export{e as default};