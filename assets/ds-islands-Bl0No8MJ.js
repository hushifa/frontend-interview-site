var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给一个由 <code>&#x27;1&#x27;</code>（陆地）和 <code>&#x27;0&#x27;</code>（水）组成的二维网格，上下左右相连的陆地算一座岛，斜着挨着的不算，问一共有几座岛。这是 LeetCode 200 题。</p>
<p>做法是从左上角开始一格一格扫。碰到一块陆地，而且之前没访问过，说明发现了一座新岛，计数加 1。接着从这块陆地出发，把和它相连的所有陆地都找出来、标记成已访问，这一步叫“淹没”这座岛。扫完整个网格，计数就是答案。</p>
<p>找相连的陆地有两种方式。DFS 是一条路走到底，用递归写最短；BFS 是一圈一圈往外扩，用队列。两者都只是遍历顺序不同，结果一样。每个格子最多被访问一次，所以时间是 O(mn)。</p>
<p>要注意，递归 DFS 的深度可能和陆地格子数一样多，网格很大、全是陆地时会栈溢出，这时用 BFS 或者显式栈更稳。另外，直接把访问过的陆地改成 <code>&#x27;0&#x27;</code> 能省掉一个 <code>visited</code> 数组，但会修改调用者传进来的数据，要先说清楚能不能改。</p>
</blockquote>
<h2>DFS 和 BFS 两种写法</h2>
<p>下面两个函数用同一个网格，都用一个 <code>visited</code> 数组记录访问过的格子，不修改输入。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">DIRECTIONS</span> = [[<span class="hljs-number">1</span>, <span class="hljs-number">0</span>], [-<span class="hljs-number">1</span>, <span class="hljs-number">0</span>], [<span class="hljs-number">0</span>, <span class="hljs-number">1</span>], [<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>]];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">numIslandsDFS</span>(<span class="hljs-params">grid</span>) {
  <span class="hljs-keyword">const</span> rows = grid.<span class="hljs-property">length</span>;
  <span class="hljs-keyword">const</span> cols = rows ? grid[<span class="hljs-number">0</span>].<span class="hljs-property">length</span> : <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> visited = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: rows }, <span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(cols).<span class="hljs-title function_">fill</span>(<span class="hljs-literal">false</span>));

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">sink</span>(<span class="hljs-params">r, c</span>) {
    <span class="hljs-keyword">if</span> (r &lt; <span class="hljs-number">0</span> || r &gt;= rows || c &lt; <span class="hljs-number">0</span> || c &gt;= cols) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">if</span> (grid[r][c] !== <span class="hljs-string">&#x27;1&#x27;</span> || visited[r][c]) <span class="hljs-keyword">return</span>;
    visited[r][c] = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [dr, dc] <span class="hljs-keyword">of</span> <span class="hljs-variable constant_">DIRECTIONS</span>) <span class="hljs-title function_">sink</span>(r + dr, c + dc);
  }

  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> r = <span class="hljs-number">0</span>; r &lt; rows; r += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> c = <span class="hljs-number">0</span>; c &lt; cols; c += <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">if</span> (grid[r][c] === <span class="hljs-string">&#x27;1&#x27;</span> &amp;&amp; !visited[r][c]) {
        count += <span class="hljs-number">1</span>;
        <span class="hljs-title function_">sink</span>(r, c);
      }
    }
  }
  <span class="hljs-keyword">return</span> count;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">numIslandsBFS</span>(<span class="hljs-params">grid</span>) {
  <span class="hljs-keyword">const</span> rows = grid.<span class="hljs-property">length</span>;
  <span class="hljs-keyword">const</span> cols = rows ? grid[<span class="hljs-number">0</span>].<span class="hljs-property">length</span> : <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> visited = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: rows }, <span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(cols).<span class="hljs-title function_">fill</span>(<span class="hljs-literal">false</span>));
  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> r = <span class="hljs-number">0</span>; r &lt; rows; r += <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> c = <span class="hljs-number">0</span>; c &lt; cols; c += <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">if</span> (grid[r][c] !== <span class="hljs-string">&#x27;1&#x27;</span> || visited[r][c]) <span class="hljs-keyword">continue</span>;
      count += <span class="hljs-number">1</span>;
      <span class="hljs-comment">// 入队时就标记，避免同一个格子被不同邻居重复放进队列。</span>
      visited[r][c] = <span class="hljs-literal">true</span>;
      <span class="hljs-keyword">const</span> queue = [[r, c]];
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> head = <span class="hljs-number">0</span>; head &lt; queue.<span class="hljs-property">length</span>; head += <span class="hljs-number">1</span>) {
        <span class="hljs-keyword">const</span> [cr, cc] = queue[head];
        <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [dr, dc] <span class="hljs-keyword">of</span> <span class="hljs-variable constant_">DIRECTIONS</span>) {
          <span class="hljs-keyword">const</span> nr = cr + dr;
          <span class="hljs-keyword">const</span> nc = cc + dc;
          <span class="hljs-keyword">if</span> (nr &lt; <span class="hljs-number">0</span> || nr &gt;= rows || nc &lt; <span class="hljs-number">0</span> || nc &gt;= cols) <span class="hljs-keyword">continue</span>;
          <span class="hljs-keyword">if</span> (grid[nr][nc] !== <span class="hljs-string">&#x27;1&#x27;</span> || visited[nr][nc]) <span class="hljs-keyword">continue</span>;
          visited[nr][nc] = <span class="hljs-literal">true</span>;
          queue.<span class="hljs-title function_">push</span>([nr, nc]);
        }
      }
    }
  }
  <span class="hljs-keyword">return</span> count;
}

<span class="hljs-keyword">const</span> grid = [
  [<span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>],
  [<span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>],
  [<span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>],
  [<span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-string">&#x27;1&#x27;</span>],
];

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">numIslandsDFS</span>(grid)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">numIslandsBFS</span>(grid)); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">numIslandsDFS</span>([[<span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-string">&#x27;0&#x27;</span>], [<span class="hljs-string">&#x27;0&#x27;</span>, <span class="hljs-string">&#x27;1&#x27;</span>]])); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">numIslandsBFS</span>([])); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p><code>grid</code> 是 LeetCode 题面的第二个例子：左上角四块连成一座，中间一块单独一座，右下角两块连成一座，一共 3 座。<code>[[&#x27;1&#x27;, &#x27;0&#x27;], [&#x27;0&#x27;, &#x27;1&#x27;]]</code> 的两块陆地是斜着挨着的，题目只算上下左右，所以是 2 座。</p>
<p><code>sink</code> 开头为什么先判断越界和是否访问过？这样调用的地方就不用管邻居合不合法，四个方向直接递归下去，不合法的在下一层直接返回。已访问的判断也很关键，没有它，两块相邻的陆地会互相递归，永远停不下来。</p>
<p>BFS 为什么要在入队时标记，而不是出队时？一个格子可能同时是好几个已入队格子的邻居。如果出队时才标记，它会被放进队列好几次，虽然结果还是对的，但做了重复的工作。</p>
<p>队列为什么用 <code>head</code> 下标，而不是 <code>queue.shift()</code>？<code>shift</code> 要把后面的元素全部往前挪，大网格上会变慢；用下标往后走，每次取出都是 O(1)。</p>
<h2>递归 DFS 什么时候会出问题</h2>
<p>递归每深入一层，调用栈就多一帧。LeetCode 这题的网格最大是 300 × 300，一共 9 万个格子，如果全是陆地，<code>sink</code> 的递归深度可能达到几万层。用 Node.js 22.23 实测，把上面的 <code>sink</code> 用在 300 × 300、全是陆地的网格上，会抛出 <code>RangeError: Maximum call stack size exceeded</code>。改成 BFS，或者用数组当栈自己压入弹出，就不受这个限制。显式栈的写法见<a href="/questions/alg-tree-traversal/">《怎样用显式栈实现树的前序遍历？》</a>。</p>
<h2>常见追问</h2>
<p><strong>并查集也能做这题，什么时候用它？</strong></p>
<blockquote>
<p>网格固定不变时，DFS 和 BFS 更直接。如果陆地是一块一块加进来的，每加一块都要回答“现在有几座岛”，每次都重新遍历太慢，用并查集只需要把新陆地和相邻陆地合并，见<a href="/questions/ds-union-find/">《并查集怎样实现？适合解决什么问题？》</a>。</p>
</blockquote>
<p><strong>怎样求最大岛屿的面积？</strong></p>
<blockquote>
<p>思路一样，只是 <code>sink</code> 不再只做标记，而是返回这座岛的格子数：当前格子算 1，再加上四个方向递归返回的数。扫描时用一个变量记录最大值。</p>
</blockquote>`};export{e as default};