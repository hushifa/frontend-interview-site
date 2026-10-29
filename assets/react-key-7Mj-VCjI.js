var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>列表重新渲染时，React 要判断新列表里的每一项，对应旧列表里的哪一项。它靠的就是 <code>key</code>：key 相同就复用原来的组件和 DOM，key 不同就把旧的卸载、新建一个。这个新旧对比的过程叫协调。</p>
<p>用下标当 key，key 代表的是“第几个”，而不是“哪条数据”。一旦在头部插入或者重新排序，原来第 0 个位置的组件状态，比如输入框里打的字、勾选状态、焦点，会留在第 0 个位置，显示到另一条数据上。</p>
<p>所以 key 应该用数据自带的 ID。它只要在兄弟元素之间唯一、在多次渲染之间不变就行。列表只会追加、从不重排，而且每项没有内部状态时，用下标也没问题。</p>
<p>还要注意，不要在渲染时生成 key，比如 <code>Math.random()</code> 或 <code>crypto.randomUUID()</code>。那样每次渲染 key 都不同，所有条目都会被重建。</p>
</blockquote>
<h2>下标会让状态错位</h2>
<p>下面每一行有一个备注输入框，key 用的是下标：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">TodoList</span>(<span class="hljs-params">{ todos }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>
      {todos.map((todo, index) =&gt; (
        <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{index}</span>&gt;</span>
          {todo.text} <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">placeholder</span>=<span class="hljs-string">&quot;备注&quot;</span> /&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
      ))}
    <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>假设列表是 <code>[A, B]</code>，用户在 A 那一行的输入框里打了“重要”。然后在头部插入 C，列表变成 <code>[C, A, B]</code>。</p>
<p>结果“重要”出现在了 C 那一行。为什么？React 对比新旧列表时，发现 key 0 还在，于是复用 key 0 原来的 <code>&lt;li&gt;</code> 和里面的 <code>&lt;input&gt;</code>，只把文字从 A 改成 C。输入框里的内容存在 DOM 里，没人去动它，就留在了原位。</p>
<p>改成 <code>key={todo.id}</code> 以后，A 的 key 一直是 A 的 ID。React 能认出 A 只是挪到了第二位，就移动 A 对应的 DOM，输入框内容跟着 A 一起走，C 则新建一行。</p>
<h2>key 还能用来重置组件</h2>
<p>key 不只用在列表上。给同一个位置的组件换一个 key，React 会认为这是另一个组件，丢掉旧的、重新创建：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">ProfileForm</span> key={userId} userId={userId} /&gt;
</code></pre></div>
<p>切换用户时，表单的所有状态都会重置。你不需要写 Effect 去手动清空每个字段。</p>
<h2>常见追问</h2>
<p><strong>组件里能读到 <code>props.key</code> 吗？</strong></p>
<blockquote>
<p>读不到。key 是给 React 用的，不会作为 prop 传进组件。组件里需要这个值的话，另外传一个 prop。</p>
</blockquote>
<p><strong>数据本身没有 ID 怎么办？</strong></p>
<blockquote>
<p>在数据进入应用的时候生成一次 ID 并保存下来，比如从接口拿到数据后。不要在渲染时生成，否则每次都是新的。</p>
</blockquote>
<p><strong>Fragment 能加 key 吗？</strong></p>
<blockquote>
<p>可以，但要写完整的 <code>&lt;Fragment key={id}&gt;</code>。简写的 <code>&lt;&gt;</code> 不能加 key。</p>
</blockquote>`};export{e as default};