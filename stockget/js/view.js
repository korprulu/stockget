(function(){

    var id = "stock_data_view";
    if(document.getElementById(id)) { return; }

    var view = document.createElement("div"),
        close_button = document.createElement("button"),
        table = function() {
            var table = document.createElement("table"),
                header = table.createTHead(),
                row = header.insertRow(0),
                index_cell = row.insertCell(0),
                time_cell = row.insertCell(1),
                price_cell = row.insertCell(2),
                change_cell = row.insertCell(3),
                trading_volume_cell = row.insertCell(4)
                trading_value_cell = row.insertCell(5);

            time_cell.textContent = "Time";
            price_cell.textContent = "Price";
            change_cell.textContent = "Change";
            trading_volume_cell.textContent = "Trading Volume";
            trading_value_cell.textContent = "Trading Value";
            
            table.style.textAlign = "center";
            table.style.width = "700px";
            table.border = "1px";

            return table;
        }(),
        loadData = function() {
            chrome.storage.local.get("issavetodb", function(item) {
                var issavetodb = item.issavetodb;
                console.log(issavetodb);
                chrome.extension.sendMessage({type: "readall"}, function(resp) {
                    if (issavetodb) {
                        // TODO
                    }
                    else {
                        var keys = Object.keys(resp)
                            i = 0, ilen = keys.length;
                        for (; i < ilen ; i++) {
                            var dataset = resp[(i + 1).toString()],
                                j = 0, jlen = dataset.length;
                            for(; j < jlen ; j++) {
                                var data = dataset[j],
                                    row = table.insertRow((i * jlen) + j),
                                    index = row.insertCell(0)
                                    time = row.insertCell(1),
                                    price = row.insertCell(2),
                                    change = row.insertCell(3),
                                    trading_volume = row.insertCell(4),
                                    trading_value = row.insertCell(5);

                                index.textContent = ((i + 1) * ilen) + (j + 1);
                                time.textContent = data[0];
                                price.textContent = data[1];
                                change.textContent = data[2];
                                trading_volume.textContent = data[3];
                                trading_value.textContent = data[4];
                            }
                        }
                    }
                });
            });
        };

    close_button.textContent = "X";

    view.id = id;
    view.style.position = "fixed";
    view.style.zIndex = "9999";
    view.style.width = "100%";
    view.style.height = "100%";
    view.style.top = "0";
    view.style.backgroundColor = "whitesmoke";
    view.style.overflow = "auto";

    view.appendChild(close_button);
    view.appendChild(table);
    document.body.appendChild(view);

    close_button.onclick = function() {
        document.body.removeChild(view);
    }

    loadData();
}).call(this);
