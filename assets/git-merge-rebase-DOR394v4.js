var e={answerHtml:`<h2>简答</h2>
<ul>
<li>merge 创建一个有两个父提交的合并提交，原有提交不变，历史保留分叉过程。</li>
<li>rebase 把当前分支的提交在新的基础上逐个重新应用，生成新的提交哈希，历史变成一条直线。</li>
<li>已经推送并被别人使用的分支不要 rebase，否则会改写别人依赖的历史。</li>
<li>常见做法：在自己的功能分支上 rebase 主分支保持更新，合入主分支时用 merge 或 squash merge。</li>
<li>两种方式的最终代码可以完全相同，区别在于历史的形状、冲突处理方式和回滚方式。</li>
</ul>
<h2>两种历史</h2>
<p>初始状态：功能分支从 B 分出，主分支之后又有了 C。</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>A---B---C          main
     \\
      D---E        feature
</code></pre></div>
<p>在 feature 上执行 <code>git merge main</code>（或在 main 上合并 feature）：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>A---B---C-------M  main
     \\         /
      D-------E    feature
</code></pre></div>
<p>在 feature 上执行 <code>git rebase main</code>：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>A---B---C          main
         \\
          D&#x27;--E&#x27;   feature
</code></pre></div>
<p>D&#x27; 和 E&#x27; 的内容改动与 D、E 相同，但父提交变了，所以是新的提交。</p>
<h2>对比</h2>
<table><thead><tr><th></th><th>merge</th><th>rebase</th></tr></thead><tbody><tr><td>原有提交</td><td>保留</td><td>被替换为新提交</td></tr><tr><td>历史形状</td><td>保留分叉和合并点</td><td>一条直线</td></tr><tr><td>冲突处理</td><td>一次性解决所有冲突</td><td>每个提交都可能要单独解决</td></tr><tr><td>共享分支</td><td>安全</td><td>会让别人的本地分支和远端分叉</td></tr><tr><td>回滚</td><td>用 <code>git revert -m 1 &lt;合并提交&gt;</code> 一次撤销整个功能</td><td>需要逐个撤销提交，或撤销 squash 后的单个提交</td></tr></tbody></table>
<h2>什么时候用哪个</h2>
<ul>
<li><strong>个人功能分支同步主分支</strong>：<code>git pull --rebase</code> 或 <code>git rebase main</code>，避免出现大量无意义的合并提交。推送已推送过的分支时用 <code>git push --force-with-lease</code>，它会在远端被别人更新过时拒绝覆盖。</li>
<li><strong>合入主分支</strong>：团队约定。squash merge 让每个 PR 在主分支上只有一个提交，便于阅读和回滚；merge commit 保留完整的开发过程。</li>
<li><strong>多人协作的分支</strong>：只用 merge。</li>
<li><strong>整理提交</strong>：合入前用 <code>git rebase -i</code> 合并、重排、修改提交信息，只在提交尚未被他人使用时这样做。</li>
</ul>
<h2>rebase 出错怎么办</h2>
<ul>
<li>冲突处理中想放弃：<code>git rebase --abort</code> 回到开始前的状态。</li>
<li>rebase 完成后发现问题：<code>git reflog</code> 找到 rebase 之前的提交哈希，<code>git reset --hard &lt;哈希&gt;</code> 恢复（这会丢弃工作区未提交的修改，先确认）。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么有人坚持不用 rebase？担心改写历史造成混乱，以及逐个解决冲突的成本。只要不在共享分支上使用，风险可控。</li>
<li><code>git pull</code> 默认是什么？默认先 fetch 再 merge，可以用 <code>git config pull.rebase true</code> 改为 rebase。</li>
</ul>`};export{e as default};