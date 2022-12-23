class Gisapi {
  constructor(queryType, netigmaQuery) {
    this.sessionid = APP.login.sessionid;
    this.queryType = queryType;
    this.netigmaQuery = netigmaQuery;
  }

  query = () =>{}

  query(callback) {
    fetch(`${APP.netigma}/gisapi/query/${this.queryType}?${this.queryType}Name=${this.netigmaQuery}&sessionid=${this.sessionid}`, { method: "GET", mode: "cors" })
      .then((response) => response.json())
      .then((jsonResonse) => {
        this.parseResponse(jsonResonse);
        const data = { rows: this.query_rows, columns: this.query_columns, columnNames: this.query_column_names, columnTypes: this.query_column_types };
        callback(data);
      });
  }


  parseResponse(response, includePrimaryKeyColumn = false) {
    if (includePrimaryKeyColumn) {
      this.query_columns = response.Columns.map((col) => col.ColumnName); // primary key columns are filtered
      this.query_column_names = response.Columns.map((col) => col.DisplayName); // primary key columns are filtered
      this.query_column_types = response.Columns.map((col) => col.DataTypeName); // primary key columns are filtered
    } else {
      this.query_columns = response.Columns.filter((col) => !col.PrimaryKey).map((col) => col.ColumnName); // primary key columns are filtered
      this.query_column_names = response.Columns.filter((col) => !col.PrimaryKey).map((col) => col.DisplayName); // primary key columns are filtered
      this.query_column_types = response.Columns.filter((col) => !col.PrimaryKey).map((col) => col.DataTypeName); // primary key columns are filtered
    }
    this.query_rows = response.Rows.map((row) => row.Cells.filter((cell) => this.query_columns.includes(cell.ColumnName)).map((cell) => cell.Value)); // Array of arrays
  }
}
