var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前序、中序、后序都是深度优先遍历，区别只在什么时候记录当前节点：前序是先记自己再走左右子树，中序是走完左子树再记自己，后序是左右子树都走完才记自己。名字里的“前中后”说的就是根节点的位置。</p>
<p>递归写法三种几乎一样，只是把“记录当前节点”这一行放在两次递归调用的前面、中间或后面。迭代写法要自己用数组当栈，代替函数调用栈：前序弹出就访问，先压右子节点再压左子节点，这样左边先出栈；中序先一路把左子节点压进栈，压到底再弹出访问，然后转到它的右子树；后序最省事的写法是按“根右左”访问，最后把结果反转成“左右根”。</p>
<p>中序遍历在二叉搜索树上会得到从小到大的序列，常用来验证二叉搜索树、找第 k 小的数；后序适合先算完子树再算自己的场景，比如统计目录大小。迭代写法的用处是树很深时不会撑爆调用栈。</p>
<p>要注意，三种写法时间都是 O(n)，栈的大小取决于树高。后序“反转”的写法得到的顺序是对的，但访问节点的真实时机不是后序，如果要在访问时做依赖子树结果的事，需要用记录上一个访问节点的写法。</p>
</blockquote>
<h2>递归和迭代六种写法</h2>
<p>先看三个递归函数里 <code>result.push</code> 的位置，再对比三个迭代函数怎样用栈。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fromLevelOrder</span>(<span class="hljs-params">values</span>) {
  <span class="hljs-keyword">if</span> (values.<span class="hljs-property">length</span> === <span class="hljs-number">0</span> || values[<span class="hljs-number">0</span>] === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> root = { <span class="hljs-attr">val</span>: values[<span class="hljs-number">0</span>], <span class="hljs-attr">left</span>: <span class="hljs-literal">null</span>, <span class="hljs-attr">right</span>: <span class="hljs-literal">null</span> };
  <span class="hljs-keyword">const</span> queue = [root];
  <span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>; i &lt; values.<span class="hljs-property">length</span>; head++) {
    <span class="hljs-keyword">const</span> node = queue[head];
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> side <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;left&#x27;</span>, <span class="hljs-string">&#x27;right&#x27;</span>]) {
      <span class="hljs-keyword">if</span> (i &lt; values.<span class="hljs-property">length</span> &amp;&amp; values[i] !== <span class="hljs-literal">null</span>) {
        node[side] = { <span class="hljs-attr">val</span>: values[i], <span class="hljs-attr">left</span>: <span class="hljs-literal">null</span>, <span class="hljs-attr">right</span>: <span class="hljs-literal">null</span> };
        queue.<span class="hljs-title function_">push</span>(node[side]);
      }
      i++;
    }
  }
  <span class="hljs-keyword">return</span> root;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">recursive</span>(<span class="hljs-params">order</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">traverse</span>(<span class="hljs-params">root, result = []</span>) {
    <span class="hljs-keyword">if</span> (!root) <span class="hljs-keyword">return</span> result;
    <span class="hljs-keyword">if</span> (order === <span class="hljs-string">&#x27;pre&#x27;</span>) result.<span class="hljs-title function_">push</span>(root.<span class="hljs-property">val</span>);
    <span class="hljs-title function_">traverse</span>(root.<span class="hljs-property">left</span>, result);
    <span class="hljs-keyword">if</span> (order === <span class="hljs-string">&#x27;in&#x27;</span>) result.<span class="hljs-title function_">push</span>(root.<span class="hljs-property">val</span>);
    <span class="hljs-title function_">traverse</span>(root.<span class="hljs-property">right</span>, result);
    <span class="hljs-keyword">if</span> (order === <span class="hljs-string">&#x27;post&#x27;</span>) result.<span class="hljs-title function_">push</span>(root.<span class="hljs-property">val</span>);
    <span class="hljs-keyword">return</span> result;
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">preorder</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> stack = root ? [root] : [];
  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
    result.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">val</span>);
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">right</span>) stack.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">right</span>);
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">left</span>) stack.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">left</span>);
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">inorder</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> stack = [];
  <span class="hljs-keyword">let</span> node = root;
  <span class="hljs-keyword">while</span> (node || stack.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">while</span> (node) {
      stack.<span class="hljs-title function_">push</span>(node);
      node = node.<span class="hljs-property">left</span>;
    }
    node = stack.<span class="hljs-title function_">pop</span>();
    result.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">val</span>);
    node = node.<span class="hljs-property">right</span>;
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">postorder</span>(<span class="hljs-params">root</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">const</span> stack = root ? [root] : [];
  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span>) {
    <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
    result.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">val</span>);
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">left</span>) stack.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">left</span>);
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">right</span>) stack.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">right</span>);
  }
  <span class="hljs-keyword">return</span> result.<span class="hljs-title function_">reverse</span>();
}

<span class="hljs-keyword">const</span> tree = <span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">8</span>, <span class="hljs-literal">null</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">6</span>, <span class="hljs-number">7</span>, <span class="hljs-number">9</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">preorder</span>(tree).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,4,5,6,7,3,8,9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">inorder</span>(tree).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 4,2,6,5,7,1,3,9,8</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">postorder</span>(tree).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 4,6,7,5,2,9,8,3,1</span>

<span class="hljs-keyword">const</span> same = [<span class="hljs-string">&#x27;pre&#x27;</span>, <span class="hljs-string">&#x27;in&#x27;</span>, <span class="hljs-string">&#x27;post&#x27;</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">order, i</span>) =&gt;</span>
  <span class="hljs-title function_">recursive</span>(order)(tree).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>) === [preorder, inorder, postorder][i](tree).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>),
);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(same.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// true,true,true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">inorder</span>(<span class="hljs-title function_">fromLevelOrder</span>([<span class="hljs-number">1</span>, <span class="hljs-literal">null</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,3,2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">preorder</span>(<span class="hljs-literal">null</span>).<span class="hljs-property">length</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>示例的树和输出取自 LeetCode 三道题的第二个示例。<code>recursive</code> 把三种递归合在一个函数里，只是为了让人看清它们只差 <code>push</code> 的位置。</p>
<p>前序为什么先压右子节点？栈是后进先出的，后压进去的左子节点会先弹出，所以访问顺序是根、左、右。逐步的栈状态推演和递归写法的栈溢出问题，在多叉树的版本里讲过，见<a href="/questions/alg-tree-traversal/">《菜单、目录这类多叉树怎样用显式栈做前序遍历？》</a>。</p>
<p>中序的外层循环条件为什么是 <code>node || stack.length</code>？<code>node</code> 不为空表示还有一棵子树没开始走，栈不为空表示还有节点在等着访问。内层循环把左边一路压进栈，弹出的节点左子树一定已经处理完了，这时访问它，再把 <code>node</code> 指向它的右子树，右子树为空的话，下一轮就直接弹出上一层的节点。</p>
<p>后序为什么能靠反转？把前序的压栈顺序改成先左后右，访问顺序就是“根右左”，整个反转过来正好是“左右根”。代价是结果要全部收集完才能反转，不能边遍历边输出。</p>
<h2>不反转的后序怎么写</h2>
<p>如果访问时要立刻用到子树的结果，需要真正按后序访问。做法是在中序的基础上多记一个 <code>prev</code>：弹出前先看栈顶，如果它有右子树、而且右子树还没访问过（<code>top.right !== prev</code>），就转去走右子树；否则才弹出访问它，并把 <code>prev</code> 设成它。多叉树用显式栈做前序遍历的写法见<a href="/questions/alg-tree-traversal/">《菜单、目录这类多叉树怎样用显式栈做前序遍历？》</a>。</p>
<h2>常见追问</h2>
<p><strong>有没有不用栈也不用递归的遍历？</strong></p>
<blockquote>
<p>有，叫 Morris 遍历。它利用叶子节点空着的右指针，临时指回中序的后继节点，走完后再把指针改回来，额外空间是 O(1)。缺点是遍历过程中会临时修改树。</p>
</blockquote>
<p><strong>怎样用中序遍历验证二叉搜索树？</strong></p>
<blockquote>
<p>二叉搜索树的中序结果一定严格递增。遍历时记住上一个访问的值，遇到当前值不大于上一个值就返回 <code>false</code>，不需要把结果全部存下来。</p>
</blockquote>
<p><strong>层序遍历属于这三种吗？</strong></p>
<blockquote>
<p>不属于。前中后序都是深度优先，用栈；层序是广度优先，用队列，见<a href="/questions/ds-binary-tree-bfs/">《二叉树怎样层序遍历、求最大深度？》</a>。</p>
</blockquote>`};export{e as default};