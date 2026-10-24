var e={answerHtml:`<p>展开语法和 Object.assign 通常只复制一层可枚举自身属性；嵌套对象仍共享引用。深拷贝则要根据业务决定如何处理循环引用、日期、Map、Set、原型以及函数等特殊值。</p>
<p>structuredClone 支持许多结构化数据以及循环引用，还可转移某些可转移对象。它不支持函数和 DOM 节点，也不是保持所有自定义原型、访问器和属性描述符的万能复制。JSON 序列化会丢失或改变 undefined、特殊数值、日期等信息，且不能直接处理循环引用。</p>
<p>状态更新通常只需要复制被修改的路径，而不是每次深拷贝整个状态树。选择方案前应写清楚输入数据的类型边界，以及是否允许原对象失去可转移资源。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> source = { <span class="hljs-attr">child</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> } };
<span class="hljs-keyword">const</span> shallow = { ...source };
<span class="hljs-keyword">const</span> deep = <span class="hljs-title function_">structuredClone</span>(source);
shallow.<span class="hljs-property">child</span>.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(source.<span class="hljs-property">child</span>.<span class="hljs-property">count</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(deep.<span class="hljs-property">child</span>.<span class="hljs-property">count</span>);
</code></pre></div>
<p>输出依次为：2、1。</p>`};export{e as default};