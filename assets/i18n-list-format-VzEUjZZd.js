var e={answerHtml:`<p>把三个参与者显示成自然语言，不只是 <code>names.join(&#x27;, &#x27;)</code>。不同语言会使用不同标点、连接词和最后一项的连接方式；“甲和乙”与“甲或乙”表达的业务含义也不同。</p>
<p>Intl.ListFormat 根据 locale、连接类型和风格生成列表文案，让应用不用为每个语言手写最后一个逗号的规则。</p>
<h3>先决定列表表达什么关系</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> names = [<span class="hljs-string">&#x27;Alice&#x27;</span>, <span class="hljs-string">&#x27;Bob&#x27;</span>, <span class="hljs-string">&#x27;Carol&#x27;</span>];
<span class="hljs-keyword">const</span> together = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, {
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;conjunction&#x27;</span>,
  <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;long&#x27;</span>,
});
<span class="hljs-keyword">const</span> alternatives = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, {
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;disjunction&#x27;</span>,
  <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;long&#x27;</span>,
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(together.<span class="hljs-title function_">format</span>(names)); <span class="hljs-comment">// Alice, Bob, and Carol</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(alternatives.<span class="hljs-title function_">format</span>(names)); <span class="hljs-comment">// Alice, Bob, or Carol</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(together.<span class="hljs-title function_">format</span>([])); <span class="hljs-comment">// 空字符串</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(together.<span class="hljs-title function_">format</span>([<span class="hljs-string">&#x27;Alice&#x27;</span>])); <span class="hljs-comment">// Alice</span>
</code></pre></div>
<p>conjunction 表示并列的“和”，disjunction 表示选择的“或”，unit 用于单位式列表。style 的 long、short、narrow 控制风格，但不是任意截断字符的长度限制，不同语言可能没有明显不同的缩写结果。</p>
<p>如果列表为空，API 返回空字符串，不会替产品决定显示“暂无参与者”还是隐藏整行。缺省状态应在业务层处理。它也不会自动去重、排序或删掉空字符串，输入清理要先完成。</p>
<h3>每一项应先变成合适的文字</h3>
<p>ListFormat 接收字符串序列，不能直接把用户对象或数值数组交给它期待自动翻译。人员列表先取展示名，金额列表先用 NumberFormat 格式化每个金额，再交给列表格式化器。</p>
<p>unit 类型也不会自动把 <code>1</code> 变成“一小时”，不会替你处理测量单位换算或复数词形。它只连接已经准备好的各项文本。</p>
<p>同样，不要先用英文拼接“3 more”，再期待 ListFormat 把这部分变成中文。超长列表的“其他 3 人”应作为独立的本地化消息设计，而且省略位置和总人数要与产品语义一致。</p>
<h3>每个名字需要链接时，用 formatToParts</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> formatter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">ListFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>, {
  <span class="hljs-attr">style</span>: <span class="hljs-string">&#x27;long&#x27;</span>,
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;conjunction&#x27;</span>,
});
<span class="hljs-keyword">const</span> parts = formatter.<span class="hljs-title function_">formatToParts</span>([<span class="hljs-string">&#x27;Alice&#x27;</span>, <span class="hljs-string">&#x27;Bob&#x27;</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(parts);
<span class="hljs-comment">// [</span>
<span class="hljs-comment">//   { type: &#x27;element&#x27;, value: &#x27;Alice&#x27; },</span>
<span class="hljs-comment">//   { type: &#x27;literal&#x27;, value: &#x27; and &#x27; },</span>
<span class="hljs-comment">//   { type: &#x27;element&#x27;, value: &#x27;Bob&#x27; }</span>
<span class="hljs-comment">// ]</span>
</code></pre></div>
<p>element 是输入项，literal 是本地化连接片段。界面可以把 element 渲染为链接，把 literal 渲染为普通文本，同时保留语言要求的顺序和标点。</p>
<p>若需要把名字关联回用户 ID，应按输入项出现顺序维护映射，不要用显示名称当唯一键；两个用户可能同名。也不要给拼接后的整句再按逗号切开，名字自己就可能包含逗号。</p>
<p>ListFormat 不做 HTML 转义。React 中可把 value 作为普通文本子节点；原生 DOM 则使用文本节点或 textContent，不要因为字符串来自格式化 API 就把它当作安全 HTML。</p>
<h3>测试语义与边界，而不是锁死所有标点</h3>
<p>至少覆盖空列表、一项、两项、多项、重复名称和目标语言。运行时的 ICU/CLDR 数据更新可能调整标点或空格，服务端和浏览器版本不同也可能出现细节差异。</p>
<p>如果快照测试需要严格一致，应固定测试运行时；跨环境测试可以检查所有项都保留、顺序正确、parts 拼接与 format 一致等契约，而不是把某个版本的空格当成永远不变的标准。</p>
<p>ListFormat 适合把短列表写进自然语言句子。很长的成员名单通常更适合可访问的列表结构、分页或折叠，不应该因为有格式化 API 就把几十个链接挤成一行。</p>`};export{e as default};