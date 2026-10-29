var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>reflog 可以理解成 Git 在本地记的一本流水账：HEAD 和每个分支每移动一次，比如提交、reset、切换分支、rebase，它都记下移动到了哪个提交。<code>git reflog</code> 默认显示 HEAD 的记录。</p>
<p>所以误执行了 <code>reset --hard</code>，提交并没有真的消失，只是没有分支指向它了。<code>HEAD@{1}</code> 表示 HEAD 上一次所在的位置，<code>git reset --hard HEAD@{1}</code> 就能回到操作之前。</p>
<p>删分支也能找回。删除时这个分支自己的 reflog 会跟着删掉，但 HEAD 的 reflog 里还留着在那个分支上提交过的记录，可以按记录里的哈希重新建分支。</p>
<p>要注意，reflog 是本地数据，不会推送，而且有过期时间，过期又没有引用的提交会被 <code>git gc</code> 清掉。从来没提交过的修改，reflog 里也没有。</p>
</blockquote>
<h2>找回被 reset 掉的提交</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git reset --hard HEAD~2
git reflog -3
# fdcdf72 HEAD@{0}: reset: moving to HEAD~2
# fb522f8 HEAD@{1}: commit: c5
# ...
git reset --hard HEAD@{1}
</code></pre></div>
<p>第一行把分支往回退了两个提交。看 reflog，<code>HEAD@{0}</code> 是刚才那次 reset，<code>HEAD@{1}</code> 是 reset 之前所在的提交 <code>fb522f8</code>。把分支重新指回它，两个提交就都回来了。</p>
<p>这里有个容易出错的地方。<code>HEAD@{n}</code> 的意思是“HEAD 往前数第 n 次所在的位置”，每做一次操作，编号都会往后挪。所以找回之前先用 <code>git reflog</code> 或 <code>git log -g</code> 确认目标哈希，直接按哈希操作更稳妥。</p>
<h2>找回已经删除的分支</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git branch -D login-form
# Deleted branch login-form (was 71b8558).

# 终端输出已经看不到时，按提交说明在 HEAD 的 reflog 里搜索
git reflog | grep &quot;添加登录表单&quot;
# 71b8558 HEAD@{3}: commit: 添加登录表单

git branch login-form 71b8558
</code></pre></div>
<p>删除分支时，Git 会打印这个分支最后指向的哈希，这是最直接的线索，拿它新建一个同名分支就恢复了。如果终端已经关了，就去 HEAD 的 reflog 里按提交说明搜。</p>
<h2>reflog 能保留多久</h2>
<p>reflog 的记录会过期。一般的条目按 <code>gc.reflogExpire</code> 过期，默认 90 天；已经不能从当前分支到达的条目按 <code>gc.reflogExpireUnreachable</code> 过期，默认 30 天。被 reset 掉的提交就属于后一种。</p>
<p>记录过期以后，如果提交也不再被任何引用指向，就可能在垃圾回收时被真正删除。所以发现误操作要尽快恢复，千万不要先跑 <code>git gc --prune=now</code>。</p>
<h2>常见追问</h2>
<p><strong>新克隆一份仓库，能用 reflog 找回别人删掉的提交吗？</strong></p>
<blockquote>
<p>不能。reflog 不会推送，只能在执行误操作的那份仓库里找。</p>
</blockquote>
<p><strong>reflog 里也找不到怎么办？</strong></p>
<blockquote>
<p>可以用 <code>git fsck --lost-found</code> 列出悬空对象，也就是没有任何引用指向的对象。但前提是这些对象还没被清理掉。</p>
</blockquote>
<p><strong>撤销命令应该怎么选？</strong></p>
<blockquote>
<p>见<a href="/questions/git-reset-revert-restore/">《git reset、revert 和 restore 有什么区别？》</a>。</p>
</blockquote>`};export{e as default};