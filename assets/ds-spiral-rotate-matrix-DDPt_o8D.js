var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>螺旋矩阵是把一个 m × n 的矩阵从左上角开始，按顺时针一圈圈往里读出来。旋转图像是把一个 n × n 的矩阵顺时针转 90 度，而且要原地修改，不能另开一个矩阵。</p>
<p>螺旋矩阵用四个变量记住还没读的区域：<code>top</code>、<code>bottom</code>、<code>left</code>、<code>right</code>。先沿 <code>top</code> 这一行从左读到右，读完 <code>top</code> 加 1；再沿 <code>right</code> 这一列往下读，<code>right</code> 减 1；然后沿 <code>bottom</code> 从右往左，<code>bottom</code> 减 1；最后沿 <code>left</code> 往上，<code>left</code> 加 1。这样一圈圈往里收，直到边界交错。</p>
<p>旋转图像有一个好记的拆法：顺时针转 90 度等于先转置，也就是沿左上到右下的对角线把 <code>[i][j]</code> 和 <code>[j][i]</code> 互换，再把每一行左右翻转。两步都是原地交换，时间 O(n²)，额外空间 O(1)。</p>
<p>要注意，螺旋矩阵走完上边和右边以后，矩阵可能只剩一行或一列，走下边和左边之前要再检查 <code>top &lt;= bottom</code>、<code>left &lt;= right</code>，否则会重复读。转置时只能交换对角线一侧的元素，<code>j</code> 从 <code>i + 1</code> 开始，全部交换一遍就换回去了。</p>
</blockquote>
<h2>螺旋矩阵</h2>
<p>看走下边和左边之前的两个 <code>if</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">spiralOrder</span>(<span class="hljs-params">matrix</span>) {
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">let</span> top = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> bottom = matrix.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">let</span> left = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> right = matrix[<span class="hljs-number">0</span>].<span class="hljs-property">length</span> - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (top &lt;= bottom &amp;&amp; left &lt;= right) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = left; j &lt;= right; j++) result.<span class="hljs-title function_">push</span>(matrix[top][j]);
    top++;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = top; i &lt;= bottom; i++) result.<span class="hljs-title function_">push</span>(matrix[i][right]);
    right--;
    <span class="hljs-keyword">if</span> (top &lt;= bottom) {
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = right; j &gt;= left; j--) result.<span class="hljs-title function_">push</span>(matrix[bottom][j]);
      bottom--;
    }
    <span class="hljs-keyword">if</span> (left &lt;= right) {
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = bottom; i &gt;= top; i--) result.<span class="hljs-title function_">push</span>(matrix[i][left]);
      left++;
    }
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">rotate</span>(<span class="hljs-params">matrix</span>) {
  <span class="hljs-keyword">const</span> n = matrix.<span class="hljs-property">length</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; n; i++) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> j = i + <span class="hljs-number">1</span>; j &lt; n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> row <span class="hljs-keyword">of</span> matrix) row.<span class="hljs-title function_">reverse</span>();
  <span class="hljs-keyword">return</span> matrix;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">spiralOrder</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>], [<span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>], [<span class="hljs-number">7</span>, <span class="hljs-number">8</span>, <span class="hljs-number">9</span>]]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,3,6,9,8,7,4,5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">spiralOrder</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>], [<span class="hljs-number">5</span>, <span class="hljs-number">6</span>, <span class="hljs-number">7</span>, <span class="hljs-number">8</span>], [<span class="hljs-number">9</span>, <span class="hljs-number">10</span>, <span class="hljs-number">11</span>, <span class="hljs-number">12</span>]]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,3,4,8,12,11,10,9,5,6,7</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">spiralOrder</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">spiralOrder</span>([[<span class="hljs-number">1</span>], [<span class="hljs-number">2</span>], [<span class="hljs-number">3</span>]]).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,3</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">rotate</span>([[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>], [<span class="hljs-number">4</span>, <span class="hljs-number">5</span>, <span class="hljs-number">6</span>], [<span class="hljs-number">7</span>, <span class="hljs-number">8</span>, <span class="hljs-number">9</span>]]))); <span class="hljs-comment">// [[7,4,1],[8,5,2],[9,6,3]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">rotate</span>([[<span class="hljs-number">5</span>, <span class="hljs-number">1</span>, <span class="hljs-number">9</span>, <span class="hljs-number">11</span>], [<span class="hljs-number">2</span>, <span class="hljs-number">4</span>, <span class="hljs-number">8</span>, <span class="hljs-number">10</span>], [<span class="hljs-number">13</span>, <span class="hljs-number">3</span>, <span class="hljs-number">6</span>, <span class="hljs-number">7</span>], [<span class="hljs-number">15</span>, <span class="hljs-number">14</span>, <span class="hljs-number">12</span>, <span class="hljs-number">16</span>]]))); <span class="hljs-comment">// [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">rotate</span>([[<span class="hljs-number">1</span>]]))); <span class="hljs-comment">// [[1]]</span>
</code></pre></div>
<p>为什么那两个 <code>if</code> 不能省？看只有一行的 <code>[[1, 2, 3]]</code>。上边读完 1、2、3 以后 <code>top</code> 变成 1，比 <code>bottom</code> 的 0 大，右边那一列的循环一次都不执行。如果不检查就去读下边，会把同一行倒着再读一遍，得到 <code>1,2,3,2,1</code>。只有一列时同理，左边那一列会被重复读。前两步不用检查，因为 <code>while</code> 条件已经保证了这一圈开始时边界没有交错。</p>
<h2>为什么转置加翻转就是顺时针旋转</h2>
<p>顺时针转 90 度时，原来第 i 行第 j 列的元素，会跑到第 j 行、倒数第 i 列，也就是 <code>[j][n - 1 - i]</code>。转置先把 <code>[i][j]</code> 送到 <code>[j][i]</code>，每行左右翻转再把 <code>[j][i]</code> 送到 <code>[j][n - 1 - i]</code>，两步合起来正好一致。</p>
<p>看第一个例子，第一行 <code>1,2,3</code> 转置后变成第一列，第一行变成 <code>1,4,7</code>，翻转后是 <code>7,4,1</code>，就是旋转后的第一行。<code>row.reverse()</code> 会原地修改数组，正好满足题目“原地旋转”的要求。</p>
<h2>常见追问</h2>
<p><strong>逆时针转 90 度怎么做？</strong></p>
<blockquote>
<p>先转置，再上下翻转，也就是把整个行数组 <code>reverse</code> 一下。也可以先把每行左右翻转再转置。转 180 度就是先上下翻转，再把每行左右翻转。</p>
</blockquote>
<p><strong>不拆成两步，能一次到位吗？</strong></p>
<blockquote>
<p>能。从外到内一圈圈处理，每圈里四个位置的元素组成一组，<code>[i][j]</code>、<code>[j][n-1-i]</code>、<code>[n-1-i][n-1-j]</code>、<code>[n-1-j][i]</code>，用一个临时变量让它们依次挪一格。时间和空间与两步法一样，只是下标容易写错。</p>
</blockquote>
<p><strong>螺旋矩阵 II 要求按螺旋顺序填 1 到 n² 怎么做？</strong></p>
<blockquote>
<p>边界收缩的写法完全一样，只是把读取 <code>matrix[i][j]</code> 改成写入一个递增的计数器。</p>
</blockquote>`};export{e as default};