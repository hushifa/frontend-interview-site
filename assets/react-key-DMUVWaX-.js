var e={answerHtml:`<p>React 更新列表时，需要判断这一轮的每个元素对应上一轮的哪一个。key 为同级元素提供稳定标识，和元素类型、所处树结构一起参与身份判断。</p>
<p>如果 key 使用数组下标，表达的其实是“第几个位置”。当数据重排时，同一个位置换了记录，React 仍可能保留这个位置原有的组件状态，于是上一条记录的草稿、展开状态或未受控输入值跟到了另一条记录身上。</p>
<h3>用可编辑草稿看清身份错位</h3>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">DraftRow</span>(<span class="hljs-params">{ item }</span>) {
  <span class="hljs-keyword">const</span> [draft, setDraft] = <span class="hljs-title function_">useState</span>(item.<span class="hljs-property">title</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">li</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>{item.title}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span>
        <span class="hljs-attr">aria-label</span>=<span class="hljs-string">{</span>\`\${<span class="hljs-attr">item.id</span>} <span class="hljs-attr">的草稿</span>\`}
        <span class="hljs-attr">value</span>=<span class="hljs-string">{draft}</span>
        <span class="hljs-attr">onChange</span>=<span class="hljs-string">{event</span> =&gt;</span> setDraft(event.target.value)}
      /&gt;
    <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">QuestionList</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [items, setItems] = <span class="hljs-title function_">useState</span>([
    { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;html&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;HTML&#x27;</span> },
    { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;css&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;CSS&#x27;</span> },
  ]);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setItems(current =&gt; [...current].reverse())}&gt;
        反转顺序
      <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>
        {items.map(item =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">DraftRow</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{item.id}</span> <span class="hljs-attr">item</span>=<span class="hljs-string">{item}</span> /&gt;</span>)}
      <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>把 HTML 那行的输入改成“我的 HTML 草稿”，再反转列表。使用 id 时，草稿仍跟随 HTML 记录，只是位置变了。</p>
<p>若把 map 改成使用 index，并写 key={index}，反转后第 0 个位置的组件仍可能保留原草稿，但现在接收到 CSS 的 item。标题与草稿就会错位。问题不是 React 没看到数据变化，而是我们给出的身份信息把“同一位置”当成了“同一记录”。</p>
<p>DraftRow 的状态初始值来自 item.title，只在相应状态初始化时采用。prop 变化并不会自动重新初始化那份 state，这也使错误 key 下的身份问题更容易观察。</p>
<h3>什么样的 key 才稳定</h3>
<p>来自数据的数据库 ID、文档 ID 或业务中稳定唯一的键通常合适。需要同时满足：在同一组兄弟元素中唯一，而且同一记录在重排或重新渲染时保持一致。</p>
<p>没有服务端 ID 时，可以在创建记录时生成一个 ID，并随着记录保存。不要在 render 或 map 回调中每次使用 Math.random、Date.now 或新生成的 UUID，否则同一条数据下一轮也会变成全新身份。</p>
<p>不稳定 key 会造成反复卸载与挂载，本地状态丢失、Effect 重建，输入焦点和性能也可能受影响。它不是一个“让 React 更努力刷新”的技巧。</p>
<h3>key 的范围是同级列表，不是全站数据库</h3>
<p>两个不同列表可以都使用 key=&quot;html&quot;，因为它们属于不同的同级集合；同一个列表里重复 key 则会造成身份歧义。</p>
<p>key 应写在 map 返回的最外层元素或组件上。若每项返回多个节点，可以使用带 key 的 Fragment，而不是只给 Fragment 里面的某个孩子加 key 后，就期待外层列表身份也清楚。</p>
<p>key 不是普通 prop，子组件不能依靠 props.key 读取记录 ID。需要 ID 时应另传 item、id 等正常属性。React 的 useId 主要服务可访问关联等稳定 ID 需求，也不应当作列表数据 key 的替代。</p>
<h3>改 key 可以有意重置状态，但要知道代价</h3>
<p>切换编辑对象时，如果设计上就是希望丢弃旧草稿，可以用编辑对象 ID 作为编辑器 key，使身份切换时重新初始化。它明确表达的是“这是另一个编辑器实例”，不是单纯再执行一次渲染。</p>
<p>组件类型发生改变、节点离开原来的树结构或被真正卸载，也会影响状态保留。相同 key 不是一个全局缓存：某一页的行完全卸载后，再翻回来，并不会仅因为 ID 相同就自动恢复曾经的全部本地状态。</p>
<p>需要跨分页、筛选或卸载继续保存草稿时，应把状态放在合适的上层或持久化结构里，按稳定 ID 管理。key 负责 React 树中的身份关系，不负责所有业务数据的存活期限。</p>
<h3>数组下标什么时候风险较低</h3>
<p>列表内容和顺序确实固定、不会插入删除重排，而且没有需要跟随记录的本地状态或 DOM 行为时，下标造成的风险较低。问题在于这些条件经常会随着功能迭代失效，例如后来新增排序、搜索、编辑或拖拽。</p>
<p>因此只要数据已经有稳定 ID，就没有必要把身份退回位置。测试时应覆盖首部插入、删除中间项、排序和筛选，并观察草稿、焦点、勾选与展开状态是否仍属于正确记录，而不只是确认列表文字看起来没变。</p>
<p>补充参考：<a href="https://react.dev/learn/preserving-and-resetting-state">React · Preserving and Resetting State</a>。</p>`};export{e as default};