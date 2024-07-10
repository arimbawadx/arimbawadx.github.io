document.addEventListener("DOMContentLoaded", function () {
  const tablesContainer = document.getElementById("tablesContainer");
  const addTableBtn = document.getElementById("addTableBtn");
  const tableModal = new bootstrap.Modal(
    document.getElementById("tableModal"),
    {}
  );
  const columnModal = new bootstrap.Modal(
    document.getElementById("columnModal"),
    {}
  );
  const rowModal = new bootstrap.Modal(document.getElementById("rowModal"), {});
  const tableForm = document.getElementById("tableForm");
  const columnForm = document.getElementById("columnForm");
  const rowForm = document.getElementById("rowForm");
  let currentTableIndex = null;
  let currentRowIndex = null;
  let currentColumnIndex = null;
  let tables = JSON.parse(localStorage.getItem("tables")) || [];

  function saveTables() {
    localStorage.setItem("tables", JSON.stringify(tables));
  }

  function renderTables() {
    tablesContainer.innerHTML = "";
    tables.forEach((table, index) => {
      table.columns = table.columns || [];
      table.rows = table.rows || [];

      const tableCard = document.createElement("div");
      tableCard.className = "card mb-3";
      tableCard.innerHTML = `
              <div class="card-header">
                  <h5 class="d-inline">${table.name}</h5>
                  <button class="btn btn-danger btn-sm float-right ml-2" onclick="deleteTable(${index})">Delete</button>
                  <button class="btn btn-secondary btn-sm float-right" onclick="editTable(${index})">Edit</button>
              </div>
              <div class="card-body">
                  <table id="table-${index}" class="table table-striped table-bordered">
                      <thead>
                          <tr>
                              ${table.columns
                                .map((col) => `<th>${col.name}</th>`)
                                .join("")}
                              <th class="no-export">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${table.rows
                            .map(
                              (row, rowIndex) => `
                              <tr>
                                  ${table.columns
                                    .map(
                                      (col) => `<td>${row[col.name] || ""}</td>`
                                    )
                                    .join("")}
                                  <td>
                                      <button class="btn btn-secondary btn-sm" onclick="editRow(${index}, ${rowIndex})">Edit</button>
                                      <button class="btn btn-danger btn-sm" onclick="deleteRow(${index}, ${rowIndex})">Delete</button>
                                  </td>
                              </tr>
                          `
                            )
                            .join("")}
                      </tbody>
                  </table>
                  <div class="mt-2">
                  <button class="btn btn-primary btn-sm" onclick="addRow(${index})">Add Row</button>
                  <button class="btn btn-secondary btn-sm" onclick="manageColumns(${index})">Manage Columns</button>
                  </div>
              </div>
          `;
      tablesContainer.appendChild(tableCard);

      var tableTitle = "Tabel Data";
      $("#judulTabel").text(tableTitle);

      // Change Title Button Click Event
      $("#changeTitleBtn").click(function () {
        var newTitle = $("#newTitle").val().trim();
        if (newTitle) {
          tableTitle = newTitle;
          $("#judulTabel").text(tableTitle);
          $("#newTitle").val("");
        }
      });

      if (table.columns.length > 0) {
        $(`#table-${index}`).DataTable({
          searching: true,
          paging: true,
          ordering: true,
          dom: "Bfrtip",
          buttons: [
            {
              extend: "pdfHtml5",
              title: function () {
                return tableTitle;
              },
              orientation: "landscape",
              pageSize: "A4",
              exportOptions: {
                columns: ":not(.no-export)",
              },
              customize: function (doc) {
                doc.content[1].table.widths = Array(
                  doc.content[1].table.body[0].length + 1
                )
                  .join("*")
                  .split("");
                doc.styles.tableHeader = {
                  fillColor: "#4CAF50",
                  color: "white",
                  alignment: "center",
                };
                // Center align all table cells
                doc.content[1].table.body.forEach(function (row) {
                  row.forEach(function (cell) {
                    if (cell.text) {
                      cell.alignment = "center";
                    }
                  });
                });
              },
            },
            {
              extend: "excelHtml5",
              title: function () {
                return tableTitle;
              },
              exportOptions: {
                columns: ":not(.no-export)",
              },
              // customize: function (xlsx) {
              //   var sheet = xlsx.xl.worksheets["sheet1.xml"];
              //   $('row c[r^="A"]', sheet).each(function () {
              //     $(this).attr("s", "42");
              //   });
              // },
            },
          ],
        });
      }
    });
  }

  window.deleteTable = function (index) {
    tables.splice(index, 1);
    saveTables();
    renderTables();
  };

  window.editTable = function (index) {
    document.getElementById("tableName").value = tables[index].name;
    tableForm.onsubmit = function (e) {
      e.preventDefault();
      tables[index].name = document.getElementById("tableName").value;
      saveTables();
      renderTables();
      tableModal.hide();
    };
    tableModal.show();
  };

  window.addRow = function (tableIndex) {
    currentTableIndex = tableIndex;
    currentRowIndex = null;
    renderRowForm();
    rowModal.show();
  };

  window.editRow = function (tableIndex, rowIndex) {
    currentTableIndex = tableIndex;
    currentRowIndex = rowIndex;
    renderRowForm(tables[tableIndex].rows[rowIndex]);
    rowModal.show();
  };

  window.deleteRow = function (tableIndex, rowIndex) {
    tables[tableIndex].rows.splice(rowIndex, 1);
    saveTables();
    renderTables();
  };

  window.manageColumns = function (tableIndex) {
    currentTableIndex = tableIndex;
    const columnList = document.getElementById("columnList");
    columnList.innerHTML = "";
    tables[tableIndex].columns.forEach((col, index) => {
      const li = document.createElement("li");
      li.className =
        "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `${col.name} - ${col.type}`;
      const btnGroup = document.createElement("div");
      btnGroup.className = "btn-group";
      btnGroup.innerHTML = `
              <button class="btn btn-secondary btn-sm" onclick="editColumn(${index})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteColumn(${index})">Delete</button>
          `;
      li.appendChild(btnGroup);
      columnList.appendChild(li);
    });
    // Show add column button
    const saveColumnBtn = document.getElementById("saveColumnBtn");
    saveColumnBtn.innerHTML = "Add Column";
    saveColumnBtn.onclick = function (e) {
      e.preventDefault();
      addColumn();
    };
    columnModal.show();
  };

  window.editColumn = function (index) {
    const column = tables[currentTableIndex].columns[index];
    document.getElementById("columnName").value = column.name;
    document.getElementById("columnType").value = column.type;
    document.getElementById("columnPosition").value = index + 1; // Position is 1-based
    document.getElementById("autoIncrement").checked =
      column.autoIncrement || false;

    columnForm.onsubmit = function (e) {
      e.preventDefault();
      const newName = document.getElementById("columnName").value;
      const newType = document.getElementById("columnType").value;
      const newPosition = parseInt(
        document.getElementById("columnPosition").value
      );
      const newAutoIncrement = document.getElementById("autoIncrement").checked;

      // Update column properties
      column.name = newName;
      column.type = newType;
      column.autoIncrement = newAutoIncrement;

      // Adjust column position if changed
      if (index !== newPosition - 1) {
        // Move column in the array
        const removedCol = tables[currentTableIndex].columns.splice(
          index,
          1
        )[0];
        tables[currentTableIndex].columns.splice(
          newPosition - 1,
          0,
          removedCol
        );
      }

      saveTables();
      renderTables();
      columnModal.hide();
    };

    const saveColumnBtn = document.getElementById("saveColumnBtn");
    saveColumnBtn.innerHTML = "Update Column";
    columnModal.show();
  };

  window.deleteColumn = function (index) {
    tables[currentTableIndex].columns.splice(index, 1);
    saveTables();
    renderTables();
  };

  function renderRowForm(row = {}) {
    const rowFields = document.getElementById("rowFields");
    rowFields.innerHTML = "";
    tables[currentTableIndex].columns.forEach((col) => {
      const div = document.createElement("div");
      div.className = "form-group";

      if (col.type === "Date") {
        const dateValue = row[col.name]
          ? new Date(row[col.name]).toISOString().substr(0, 10)
          : "";
        div.innerHTML = `
                <label for="${col.name}">${col.name}</label>
                <input type="date" class="form-control" id="${col.name}" value="${dateValue}">
            `;
      } else if (!col.autoIncrement) {
        div.innerHTML = `
                <label for="${col.name}">${col.name}</label>
                <input type="text" class="form-control" id="${
                  col.name
                }" value="${row[col.name] || ""}">
            `;
      }

      rowFields.appendChild(div);
    });

    rowForm.onsubmit = function (e) {
      e.preventDefault();
      const newRow = {};
      tables[currentTableIndex].columns.forEach((col) => {
        if (col.type === "Date") {
          newRow[col.name] = document.getElementById(col.name).value;
        } else if (!col.autoIncrement) {
          newRow[col.name] = document.getElementById(col.name).value;
        }
      });

      // Handle auto-increment
      tables[currentTableIndex].columns.forEach((col) => {
        if (col.autoIncrement) {
          let maxId = 0;
          tables[currentTableIndex].rows.forEach((row) => {
            const id = parseInt(row[col.name]);
            if (!isNaN(id) && id > maxId) {
              maxId = id;
            }
          });
          newRow[col.name] = maxId + 1;
        }
      });

      if (currentRowIndex === null) {
        tables[currentTableIndex].rows.push(newRow);
      } else {
        tables[currentTableIndex].rows[currentRowIndex] = newRow;
      }
      saveTables();
      renderTables();
      rowModal.hide();
    };
  }

  function addColumn() {
    const newName = document.getElementById("columnName").value;
    const newType = document.getElementById("columnType").value;
    const newPosition = parseInt(
      document.getElementById("columnPosition").value
    );
    const newAutoIncrement = document.getElementById("autoIncrement").checked;

    const newColumn = {
      name: newName,
      type: newType,
      autoIncrement: newAutoIncrement,
    };

    tables[currentTableIndex].columns.splice(newPosition - 1, 0, newColumn);

    saveTables();
    renderTables();
    columnModal.hide();
  }

  addTableBtn.addEventListener("click", function () {
    tableForm.onsubmit = function (e) {
      e.preventDefault();
      const tableName = document.getElementById("tableName").value;
      const newTable = {
        name: tableName,
        columns: [],
        rows: [],
      };
      tables.push(newTable);
      saveTables();
      renderTables();
      tableModal.hide();
    };
    tableModal.show();
  });

  renderTables();
});
