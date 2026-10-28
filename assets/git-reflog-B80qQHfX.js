var e={answerHtml:`<h2>简答</h2>
<ul>
<li>reflog 记录 HEAD 和分支引用每次变化的位置，例如提交、reset、切换分支、rebase。<code>git reflog</code> 默认显示 HEAD 的记录。</li>
<li><code>HEAD@{1}</code> 表示 HEAD 上一次所在的位置。误执行 <code>reset --hard</code> 后，<code>git reset --hard HEAD@{1}</code> 可以回到操作之前。</li>
<li>删除分支时，该分支自己的 reflog 也会被删除，但 HEAD 的 reflog 里仍有在那个分支上提交过的记录，可以据此新建分支。</li>
<li>reflog 是本地数据，有过期时间，过期且没有引用的提交会被 <code>git gc</code> 清理。从未提交过的修改不在 reflog 中。</li>
</ul>
<h2>找回 reset 掉的提交</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git reset --hard HEAD~2
git reflog -3
# fdcdf72 HEAD@{0}: reset: moving to HEAD~2
# fb522f8 HEAD@{1}: commit: c5
# ...
git reset --hard HEAD@{1}
</code></pre></div>
<p><code>HEAD@{n}</code> 按&quot;HEAD 的第 n 次之前的位置&quot;计数，每做一次操作编号都会变化。找回前先用 <code>git reflog</code> 或 <code>git log -g</code> 确认目标哈希，再按哈希操作更稳妥。</p>
<h2>找回已删除分支</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git branch -D login-form
# Deleted branch login-form (was 71b8558).

# 终端输出已经看不到时，按提交说明在 HEAD 的 reflog 里搜索
git reflog | grep &quot;添加登录表单&quot;
# 71b8558 HEAD@{3}: commit: 添加登录表单

git branch login-form 71b8558
</code></pre></div>
<p>删除时 Git 会打印分支最后指向的哈希，这是最直接的线索。终端已经关闭时，在 HEAD 的 reflog 中按提交说明搜索。</p>
<h2>保留时间</h2>
<p>reflog 条目按 <code>gc.reflogExpire</code> 过期，默认 90 天；当前分支已不可达的条目按 <code>gc.reflogExpireUnreachable</code> 过期，默认 30 天。条目过期后，提交如果不再被任何引用指向，就可能在垃圾回收时被删除。发现误操作后应尽快恢复，不要先运行 <code>git gc --prune=now</code>。</p>
<h2>常见追问</h2>
<ul>
<li>新克隆的仓库能用 reflog 找回别人删掉的提交吗？不能。reflog 不会推送，只能在执行误操作的那份仓库里找。</li>
<li>reflog 里也没有怎么办？可以用 <code>git fsck --lost-found</code> 列出悬空对象，但只适用于对象尚未被清理的情况。</li>
<li>撤销命令怎么选，见<a href="/questions/git-reset-revert-restore/">《git reset、revert 和 restore 有什么区别？》</a>。</li>
</ul>`};export{e as default};