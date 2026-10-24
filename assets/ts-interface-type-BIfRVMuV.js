var e={answerHtml:`<p><code>interface</code> 和 <code>type</code> 都能描述对象结构。<code>interface</code> 支持声明合并，可通过 <code>extends</code> 扩展；类型别名可以描述联合类型、元组、原始类型别名以及映射类型等。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">User</span> { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> }
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Admin</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_">User</span> { <span class="hljs-attr">role</span>: <span class="hljs-string">&quot;admin&quot;</span> }
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Result</span> = { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>; <span class="hljs-attr">value</span>: <span class="hljs-title class_">User</span> }
  | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>; <span class="hljs-attr">error</span>: <span class="hljs-built_in">string</span> };
</code></pre></div>
<p>组合对象时，<code>extends</code> 与交叉类型遇到冲突属性的报错行为不同。公开且需要可扩展的对象契约可优先考虑接口；表达联合关系时使用类型别名更直接。团队一致性也很重要。</p>
<h3>复习提示</h3>
<p>回答时区分编译期类型检查与运行时 JavaScript 行为。类型体操或配置项要说明适用边界，公共类型还要关注错误提示、编译耗时和不同 TypeScript 版本的差异。可先用一个最小示例验证“interface、type”，再补充空值、异常和兼容性边界。</p>`};export{e as default};