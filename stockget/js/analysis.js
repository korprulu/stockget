/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
function Analysis() {
    var page_navi, active_page, last_page;
    page_navi = document.body.querySelector("div.page>table.page_navi");
    active_page = page_navi.querySelector("td.active>a").innerHTML;
    if (!active_page) {
        throw "Do not know active page";
    }

    last_page = page_navi.querySelector("td.plast>a");
    if (last_page && "search" in last_page) {
        last_page = function(query){
            var seg = query.replace(/^\?/, "").split("&");
            for (var i = 0, len = seg.length ; i < len ; i++) {
                if (!seg[i]) { continue; }
                if (seg[i].indexOf("cur_page") > -1) {
                    return seg[i].split("=")[1];
                }
            }
            return;
        }(last_page.search.toString());
    }
    else {
        // throw "Do not know last page!!";
        last_page = 1;
    }

    try {
        chrome.storage.local.set({"current_page": active_page});
        chrome.storage.local.set({"last_page": last_page});
    }
    catch (err) {
        console.error(err.message);
    }
}

Analysis();
