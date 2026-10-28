var e={answerHtml:`<h2>简答</h2>
<ul>
<li>可辨识联合用一个共同的字面量字段（如 kind 或 status）区分各个分支。</li>
<li>按这个字段 switch 时，TypeScript 会在每个分支收窄到对应成员。</li>
<li>default 中把值传给 assertNever(value: never)，新增分支却漏处理时会编译报错。</li>
<li>用联合代替多个可选布尔值，可以排除 loading 与 error 同时为真之类的非法状态。</li>
</ul>
<p>如果请求状态分别用 isLoading、isSuccess、isError 三个布尔值表示，就可能组合出“正在加载，同时成功和失败”。再加上可选 data 与 error，组件还要不断猜测这些字段是不是与状态一致。</p>
<p>可辨识联合把允许的状态列成不同对象分支，用一个共同的字面量字段区分它们。进入 success 分支时 data 必须存在，进入 error 分支时 error 必须存在，其他分支不再随意携带这些互相矛盾的承诺。</p>
<h2>每个状态带上它真正需要的数据</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">RequestState</span>&lt;T&gt; =
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;idle&#x27;</span> }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span> }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span>; <span class="hljs-attr">data</span>: T }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;error&#x27;</span>; <span class="hljs-attr">error</span>: <span class="hljs-title class_">Error</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">assertNever</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">never</span></span>): <span class="hljs-built_in">never</span> {
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未处理的状态：<span class="hljs-subst">\${<span class="hljs-built_in">JSON</span>.stringify(value)}</span>\`</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">describe</span>(<span class="hljs-params"><span class="hljs-attr">state</span>: <span class="hljs-title class_">RequestState</span>&lt;<span class="hljs-keyword">readonly</span> <span class="hljs-built_in">string</span>[]&gt;</span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">switch</span> (state.<span class="hljs-property">status</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;idle&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;尚未加载&#x27;</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;loading&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;加载中&#x27;</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;success&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${state.data.length}</span> 项\`</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;error&#x27;</span>:
      <span class="hljs-keyword">return</span> state.<span class="hljs-property">error</span>.<span class="hljs-property">message</span>;
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-title function_">assertNever</span>(state);
  }
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">describe</span>({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span>, <span class="hljs-attr">data</span>: [<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;CSS&#x27;</span>] })); <span class="hljs-comment">// 2 项</span>
</code></pre></div>
<p>status 不是一个宽泛的 string，而是每个分支里的特定字面量。编译器检查 status 后，就能把整个 state 关联到对应分支，因此 success 中可直接读取 data，不需要再加非空断言。</p>
<p>相比 <code>{ status: &#x27;idle&#x27; | &#x27;loading&#x27; | &#x27;success&#x27; | &#x27;error&#x27;; data?: T; error?: Error }</code>，联合更明确地表达了字段之间的关联。后者虽然限制了 status 的取值，却仍然允许 success 没有 data。</p>
<h2>不合理的对象会在构造位置暴露</h2>
<p>下面继续使用上面的 RequestState：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// @ts-expect-error success 分支必须提供 data</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">missingData</span>: <span class="hljs-title class_">RequestState</span>&lt;<span class="hljs-built_in">string</span>&gt; = { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span> };

<span class="hljs-comment">// @ts-expect-error 这个 loading 对象字面量不属于携带 data 的成功分支</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">contradictory</span>: <span class="hljs-title class_">RequestState</span>&lt;<span class="hljs-built_in">string</span>&gt; = { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span>, <span class="hljs-attr">data</span>: <span class="hljs-string">&#x27;旧结果&#x27;</span> };
</code></pre></div>
<p>这有助于让状态更新函数与组件都围绕同一份契约工作。但它不是运行时对象的精确字段过滤器：结构类型允许某些带额外字段的已有对象被赋值，断言或 any 也能绕过检查。真正应依赖的是分支所保证的必需信息，而不是幻想内存里不可能存在任何额外属性。</p>
<p>如果业务本来就允许刷新时显示旧数据，就不该靠把 loading 强行断言成 success 解决，而应修改模型，例如增加 <code>{ status: &#x27;refreshing&#x27;; data: T }</code>，明确说明当前正在刷新且保留旧数据。</p>
<h2>穷尽检查怎样帮助后续维护</h2>
<p>每个 case 处理掉一个联合分支，全部处理完后，default 中的 state 才能被收窄为 never。若以后新增 refreshing 却没有更新 describe，传给 assertNever 的 state 仍有可能是 refreshing，编译器就会报错。</p>
<p>如果 default 只是无条件返回“未知状态”，新增分支可能悄悄落进这个回退，不再提示所有处理点更新。因此是否需要穷尽检查，取决于这个函数是否必须明确理解每个合法状态。</p>
<p>assertNever 的运行时抛错仍有价值：外部输入、错误断言或不同版本数据可能突破静态模型。不过它只能说明“到了未处理分支”，不替代完整数据验证。</p>
<h2>字面量与字段关联不要在中途丢掉</h2>
<p>构造对象后，属性类型有时会被推宽为 string；将它传入要求 status 为特定字面量的接口，就可能报错。可以在创建处明确标注 RequestState、使用合适的 satisfies，或按需要保留字面量信息，不应因为知道文本看起来对就随手加双重断言。</p>
<p>也应在仍保留状态关联的位置进行分支判断。现代 TypeScript 能处理部分 const 解构后的判别关系，但把 status 与其他数据拆散、分别修改或传给互不关联的参数后，不一定还能维持原来的推导。</p>
<p>比起到处解释为什么某个 data! 肯定有值，让函数接收完整状态对象并在内部收窄，通常更清楚。</p>
<h2>联合描述状态，不自动实现状态机</h2>
<p>RequestState 说明“有哪些合法的静态形态”，没有说明 idle 能否直接跳到 success，也没有自动阻止重复点击或旧请求覆盖新请求。</p>
<p>比如用户连续搜索 A 和 B，A 的慢结果在 B 后返回。即使两个结果都构造成合法的 success 对象，界面仍可能被旧结果覆盖。需要额外使用请求标识、取消机制或状态机迁移规则，保证只接受当前任务的结果。</p>
<p>真实产品也可能同时存在不同维度：数据加载状态、编辑状态和网络连接状态不一定互斥。可以分别建模独立维度，而不是硬塞进一个越来越巨大的 status 联合。只把确实互斥、确实相关的数据放在同一组分支里。</p>
<h2>外部 JSON 需要先变成可信的状态</h2>
<p>接口返回 <code>{ status: &#x27;success&#x27; }</code> 并不会因为调用处标了 RequestState 就自动补出 data。应检查判别字段、分支必需字段与业务约束，再进入应用内部的联合模型。</p>
<p>Error 也不是普通 JSON 往返就会完整还原的对象。跨网络或持久化的数据可以使用明确的错误码与消息结构，再在应用边界转换为内部状态。</p>
<p>可辨识联合的主要收益，是把关联约束集中表达，让状态创建、分支处理和后续扩展更容易检查。它与运行时校验、请求生命周期和错误恢复相互配合，而不是替代这些设计。</p>`};export{e as default};