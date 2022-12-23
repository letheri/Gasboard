class Dashboard {
  constructor() {
    this.compactGraph = true;
    this.createCategories(this.compactGraph);
    this.switchButtons = document.getElementsByClassName("switch");
    this.graphSwitcher();
  }
  createCategories() {
    this.config = APP.appConfig.dashboard;
    const container = document.getElementById("category_container");
    container.innerHTML = "";
    let c = 0;
    for (const i in this.config) {
      c++;

      // yeni kategori açar
      const newRow = document.createElement("div");
      newRow.classList.add("row", "mb-3", "mt-1", "category");
      newRow.id = "row" + c;
      // kategori satır başlığı
      const titleDiv = document.createElement("div");
      newRow.appendChild(titleDiv);
      titleDiv.classList.add("col-2", "text-center", "d-flex", "flex-column", "justify-content-center");
      const titleH2 = document.createElement("h2");
      titleDiv.appendChild(titleH2);
      const titleSpan = document.createElement("span");
      titleH2.appendChild(titleSpan);
      titleSpan.classList.add("badge", "text-bg-dark", "shadow");
      titleSpan.innerText = i;

      // kategori başlık ve kartların arasındaki ayıraç
      const seperator = document.createElement("div");
      newRow.appendChild(seperator);
      seperator.classList.add("col-md-1", "p-md-2");
      const seperatorDiv = document.createElement("div");
      seperatorDiv.classList.add("vr", "h-100", "d-none", "d-md-block");
      seperator.appendChild(seperatorDiv);

      // kartların olduğu alanı yaratır
      const cardContainer = document.createElement("div");
      newRow.appendChild(cardContainer);
      cardContainer.classList.add("col-12", "col-md-9");
      const cardContainerRow = document.createElement("div");
      cardContainerRow.classList.add("row");
      cardContainer.appendChild(cardContainerRow);

      container.appendChild(newRow);
      for (const chart in this.config[i]) {
        const config = this.config[i][chart];
        switch (config.chart) {
          case "sum":
            this[config.queryName] = new Sum(chart, cardContainerRow, config.queryName, config.type,config.compare, config.unit, config.icon);
            break;
          case "donut":
            this[config.queryName] = new Donut(chart, cardContainerRow, config.queryName, this.compactGraph, config.order, config.category);
            break;
          case "table":
            this[config.queryName] = new Table(chart, cardContainerRow, config.queryName);
            break;
          case "line":
            this[config.queryName] = new Line(chart, cardContainerRow, config.queryName, this.compactGraph);
            break;
        }
      }
    }
  }

  graphSwitcher() {
    this.switchButtons = [...document.getElementsByClassName("switch")];
    for (const i of this.switchButtons) {
      i.addEventListener("click", () => {
        if (!i.classList.contains("switch__selected")) {
          this.switchButtons.filter((i) => i.classList.contains("switch__selected"))[0].classList.remove("switch__selected");
          i.classList.add("switch__selected");
        } else {
          this.switchButtons.filter((i) => !i.classList.contains("switch__selected"))[0].classList.add("switch__selected");
          i.classList.remove("switch__selected");
        }
        if (i.querySelector("span").innerText === "Özet") {
          this.compactGraph = true;
        } else {
          this.compactGraph = false;
        }
        this.createCategories();
      });
    }
  }
}

class Sum {
  constructor(title, element, netigmaQuery, queryType, compare, unit, icon) {
    this.title = title;
    this.element = element;
    this.canBeCompared = compare
    this.unit = unit
    this.icon = icon
    this.request = new Gisapi(queryType, netigmaQuery);
    this.request.query(this.generateSum.bind(this));
  }

  generateSum(data) {
    const _data = data;
    for (const col of _data.columnTypes) {
      if (col === "Date") {
        const dateIndex = _data.columnTypes.indexOf(col);
        for (const dataRow of _data.rows) {
          const _tarih = new Date(dataRow[dateIndex]);
          dataRow[dateIndex] = `${_tarih.getDate()}.${_tarih.getMonth() + 1}.${_tarih.getFullYear()}`; // date parsed
        }
      }
      else if (col === 'Int64'){
        this.lastCount = _data.rows[0][0];
      }
    }
    if (this.canBeCompared){
        const lastData = _data.rows[0];
        const previousData = _data.rows[1];
        const indexOfCountColumn = _data.columnTypes.indexOf(_data.columnTypes.filter((i) => i !== "Date")[0]);
        this.lastCount = lastData[indexOfCountColumn];
        const previousCount = previousData[indexOfCountColumn];
        this.comparePart = `                
        <p class="mb-0 text-muted card-details">
            <span class="text-${this.lastCount - previousCount > 0 ? "success" : "warning"} me-2">
            <span class="bi bi-caret-${this.lastCount - previousCount > 0 ? "up" : "down"}-fill"></span> 
                ${(((this.lastCount - previousCount) * 100) / previousCount).toFixed(2)}%
            </span>
        <span class="text-nowrap text-secondary">Geçen aya kıyasla </span>
        </p>`
    }
    const sumElement = document.createElement('div');
    sumElement.classList.add("col-12", "col-md-6")
    sumElement.innerHTML = `
        <div class="card shadow mb-3 mt-1 bg-body rounded overflow-hidden">
        <div class="card-body">
            <div class="row">
            <div class="col-8">
                <h6 class="text-uppercase mt-0">${this.title}</h6>
                <h3 class="my-2" id="active-users-count">${this.lastCount} ${this.unit}</h3>
                ${this.canBeCompared ? this.comparePart : ''}
            </div>
            <div class="col-4">
                <img src="${this.icon}" class="sum_icon float-end text-dark" />
            </div>
            </div>
        </div>
        </div>
    `;
    
    this.element.appendChild(sumElement);
  }
}

class Donut {
  constructor(title, element, netigmaQuery, compact, order, category) {
    this.title = title;
    this.donutChart = element;
    this.compactGraph = compact;
    this.order = order;
    this.category = category;
    const request = new Gisapi("query", netigmaQuery);
    request.query(this.generateElement.bind(this));
  }

  generateElement(data) {
    this.data = data;

    const lastData = this.data.rows[0]; // Gelen veri netigma sorgu ayarlarından sıralanmalıdır, ilk satır görüntülenir
    const previousData = this.data.rows[this.data.rows.length - 1]; // kartın karşılaştırması için kullanılır
    this.countColumnIndex = this.data.columnNames.indexOf(this.data.columnNames.filter((i) => i == "Count")[0]); // Y Axis tanımı burada yapılıyor
    this.valueColumnIndex = this.data.columnNames.indexOf(this.data.columnNames.filter((i) => i !== "Count")[0]); // X axis tanımı burada yapılıyor
    const largestValue = lastData[this.valueColumnIndex];
    const largestCount = lastData[this.countColumnIndex];
    const smallestValue = previousData[this.valueColumnIndex];
    const smallestCount = previousData[this.countColumnIndex];

    this.cutoff = 5; // 5. değerden sonrakiler kapalı gelir
    this.element = document.createElement("div");
    this.element.classList.add("col-12", "col-md-6", this.order);
    if (this.compactGraph) {
      document.documentElement.style.setProperty("--donut-height", "10rem");
      this.element.innerHTML = `
        <div class="card shadow mb-3 mt-1 bg-body rounded">
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <h6 class="text-uppercase mt-0 mb-3">${this.title}</h6>
                        <p class="my-2 d-flex align-items-center" id="active-users-count">
                            <img src="/images/icons/gauge-high.svg" class="icon float-end icon__max mx-2" />${largestValue}
                        </p>
                        <p class="my-2 d-flex align-items-center" id="active-users-count">
                            <img src="/images/icons/gauge-high.svg" class="icon float-end icon__min mx-2" />${smallestValue}
                        </p>
                        <div class="mb-0 text-muted card-details dropdown donut-settings">
                            <span class="text-nowrap text-secondary m-0 btn dropdown-toggle" data-bs-toggle="dropdown">${this.category} Sayısı Limiti</span>
                            <div class="dropdown-menu text-center" style="width: inherit">
                            <label for="cutoffSlider" class="form-label">${this.category} Sayısı</label>
                            <div class="d-flex m-3">
                            <span class="mw-25 mx-2">${1}</span>
                            <input type="range" class="form-range" id="cutoffSlider" min="${0}" max="${this.data.rows.length}" value="${this.cutoff}" />
                            <span class="mx-2">${this.data.rows.length}</span>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="chart-wrapper__large"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    } else {
      document.documentElement.style.setProperty("--donut-height", "27rem");
      this.cutoff = this.data.rows.length;
      this.element.innerHTML = `
      <div class="card shadow mb-3 mt-1 bg-body rounded">
        <div class="card-body">
            <div class="row">
            <div class="col-6">
                <h6 class="text-uppercase mt-0 mb-3">${this.title}</h6>
            </div>
            <div class="col-6">
                <div class="mb-0 text-muted card-details dropdown donut-settings d-none" style="">
                <span class="text-nowrap text-secondary m-0 btn dropdown-toggle" data-bs-toggle="dropdown">Mahalle Sayısı</span>
                <div class="dropdown-menu text-center" style="width: inherit;">
                    <label for="cutoffSlider" class="form-label">Alt Limit</label>
                    <div class="d-flex mx-3">
                    <span class="mw-25 mx-2">${1}</span>
                    <input type="range" class="form-range" id="cutoffSlider" min="${0}" max="${this.data.rows.length}" value="${this.data.rows.length}" />
                    <span class="mx-2">${this.data.rows.length}</span>
                    </div>
                </div>
                </div>
            </div>
                <div class="chart-wrapper__large"></div>
            </div>
        </div>
    </div>
    `;
    }
    this.canvasWrapper = this.element.querySelector(".chart-wrapper__large");
    this.donutChart.appendChild(this.element);
    // this.donutChart.addEventListener("click", () => {
    //   new Table(this.title, this.donutChart, this.queryName);
    //   document.getElementById("myModal").toggleAttribute();
    // });

    this.filter_data(this.cutoff);
    this.cutoffSlider = this.element.querySelector("input");
    this.cutoffSlider.addEventListener("change", () => {
    console.log(this)

      this.filter_data(this.cutoffSlider.value);
      this.cutoff = this.cutoffSlider.value;
      this.generate_chart();
    });
    this.generate_chart();

  }

  filter_data(cutoff) {
    this.filteredData = this.data.rows.filter((i) => this.data.rows.indexOf(i) <= parseInt(cutoff));
  }

  generate_chart() {
    // TODO - buranın daha mantıklı hale getirilmesi lazım. Geçişler mağara adamı tarzı oldu
    this.canvasWrapper.innerHTML = ""; // Özet - Detaylı geçişi yapılırken ilk olarak temizler
    const canvas = document.createElement("canvas");
    this.canvasWrapper.appendChild(canvas);
    const yAxis = this.filteredData.map((i) => i[this.countColumnIndex]);
    const labels = this.filteredData.map((i) => `${i[this.valueColumnIndex]}: ${i[this.countColumnIndex]} Sm³`);
    var options = {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Sm³",
            data: yAxis,
            backgroundColor: yAxis.map((i) => Utils.generateColor()), // her data elemanı için random renk oluşturur
          },
        ],
      },
      options: {
        cutout: "90%",
        radius: "90%",
        plugins: {
          legend: {
            display: this.compactGraph ? false : true,
            position: 'left',
          },
        },
        elements: {
          arc: {
            spacing: 5,
            borderRadius: 15,
          },
        },
      },
    };

    var ctx = canvas.getContext("2d");
    new Chart(ctx, options);
  }
}

class Table {
  constructor(title, element, netigmaQuery) {
    this.title = title;
    this.tableContainer = element;
    this.netigmaQuery = netigmaQuery;
    this.request = new Gisapi("query", this.netigmaQuery);
    this.request.query(this.generateTable.bind(this));
  }

  setCount() {
    if (this.rowCount > 5) {
      this.cardFooterSpan.innerText = "İlk 5 kayıt gösteriliyor. Devamını yüklemek için tıklayınız.";
    } else {
      this.cardFooterSpan.innerText = `Toplam ${this.rowCount} kayıt vardır.`;
    }
  }

  generateTable(data) {
    this.rowCount = APP.dashboard[this.netigmaQuery].request.query_rows.length;
    // Evet amele gibi tek tek elementleri oluşturdum..
    const tableCardEl = document.createElement("div");
    tableCardEl.classList.add("col-12");

    const tablecard = document.createElement("div");
    tablecard.classList.add("card", "mb-3", "mt-1", "shadow");
    tableCardEl.appendChild(tablecard);

    const tableBody = document.createElement("div");
    tableBody.classList.add("card-body", "pb-0");
    tablecard.appendChild(tableBody);

    const tableTitleH5 = document.createElement("h5");
    tableTitleH5.classList.add("mb-0");
    tableTitleH5.innerText = this.title.toUpperCase();
    tableBody.appendChild(tableTitleH5);

    const tableElement = document.createElement("div");
    tableElement.classList.add("mt-2");
    tableBody.appendChild(tableElement);

    const chart = document.createElement("div");
    const grid = new gridjs.Grid({
      columns: APP.dashboard[this.netigmaQuery].request.query_column_names,
      sort: true,
      data: APP.dashboard[this.netigmaQuery].request.query_rows,
      pagination: {
        limit: 5,
      },
      language: trTR,
    }).render(tableElement);

    this.tableContainer.appendChild(tableCardEl);
  }
}

class Line {
  constructor(title, element, netigmaQuery, compactGraph) {
    this.title = title;
    this.lineCard = element;
    this.compactGraph = compactGraph;
    const request = new Gisapi("query", netigmaQuery);
    request.query(this.generateElement.bind(this));
  }

  generateElement(data) {
    this.data = data;
    for (const col of this.data.columnTypes) {
      if (col.includes("Date")) {
        const dateIndex = this.data.columnTypes.indexOf(col);
        for (const dataRow of this.data.rows) {
          const _tarih = new Date(dataRow[dateIndex]);
          dataRow[dateIndex] = `${_tarih.getDate()}.${_tarih.getMonth() + 1}.${_tarih.getFullYear()}`; // date parsed
        }
      }
    }
    const lastData = this.data.rows[0]; // Gelen veri netigma sorgu ayarlarından sıralanmalıdır, ilk satır görüntülenir
    const previousData = this.data.rows[1]; // kartın karşılaştırması için kullanılır
    this.countColumnIndex = this.data.columnNames.indexOf(this.data.columnNames.filter((i) => i == "Count")[0]); // Y Axis tanımı burada yapılıyor
    this.dateColumnIndex = this.data.columnNames.indexOf(this.data.columnNames.filter((i) => i !== "Count")[0]); // X axis tanımı burada yapılıyor
    const lastCount = lastData[this.countColumnIndex];
    const lastDate = lastData[this.dateColumnIndex];
    const previousCount = previousData[this.countColumnIndex];
    const element = document.createElement("div");
    this.compactGraph ? element.classList.add("col-12", "col-md-6") : element.classList.add("col-12") 
    if (this.compactGraph) {
      document.documentElement.style.setProperty("--line-height", "6rem");
      element.innerHTML = `
        <div class="card shadow mb-3 mt-1 bg-body rounded">
            <div class="card-body">
                <div class="row">
                    <div class="col-6">
                        <h6 class="text-uppercase mt-0">${this.title}</h6>
                        <h2 class="my-2" id="active-users-count">
                            ${lastCount} 
                            <span class="fs-4 text-muted">(${lastDate})</span>
                        </h2>
                        <div class="mb-0 text-muted card-details">
                            <span class="text-${lastCount - previousCount > 0 ? "success" : "warning"} me-2">
                            <span class="bi bi-caret-${lastCount - previousCount > 0 ? "up" : "down"}-fill"></span> 
                                ${(((lastCount - previousCount) * 100) / previousCount).toFixed(2)}%
                            </span>
                            <span class="text-nowrap text-secondary m-0">Geçen yıla kıyasla</span>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="chart-wrapper">
                            <canvas class=""></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    } else {
      document.documentElement.style.setProperty("--line-height", "12rem");
      element.innerHTML = `
            <div class="card shadow mb-3 mt-1 bg-body rounded">
                <div class="card-body">
                    <h6 class="text-uppercase mt-0">${this.title}</h6>
                    <div class="chart-wrapper">
                        <canvas class=""></canvas>
                    </div>
                </div>
            </div>
    `;
    }
    this.canvas = element.querySelector("canvas");
    this.lineCard.appendChild(element);
    this.generateChart();
  }

  #colors = {
    primary: {
      default: "rgba(13, 37, 61, 1)",
      half: "rgba(13, 37, 61, 0.5)",
      quarter: "rgba(13, 37, 61, 0.25)",
      zero: "rgba(13, 37, 61, 0)",
    },
    secondary: {
      default: "rgba(17,189,199, 1)",
      half: "rgba(17,189,199, 0.5)",
      quarter: "rgba(17,189,199, 0.25)",
      zero: "transparent",
    },
    tertiary: {
      default: "rgba(181,231,236, 1)",
      quarter: "rgba(181,231,236, 0.25)",
    },
  };
  generateChart() {
    this.data.rows.reverse();
    const yAxis = this.data.rows.map((i) => i[this.countColumnIndex]);
    const dataBounds = this.chartMaxMin(yAxis);
    const labels = this.data.rows.map((i) => i[this.dateColumnIndex]);

    // const chart = document.getElementById("canvas");
    const ctx = this.canvas.getContext("2d");
    ctx.canvas.height = 100;

    const gradient = ctx.createLinearGradient(
      0, // gradient starting point for x0
      0, // gradient starting point for y0
      0, // end of x
      this.compactGraph ? 80 : 170 // end of y
    );
    gradient.addColorStop(0, this.#colors.secondary.half);
    gradient.addColorStop(0.7, this.#colors.secondary.quarter);
    gradient.addColorStop(1, this.#colors.secondary.zero);

    const options = {
      type: this.compactGraph? "line":"bar",
      data: {
        labels: labels,
        datasets: [
          {
            fill: true,
            backgroundColor: gradient,
            pointBackgroundColor: this.#colors.secondary.default,
            pointBorderColor: "transparent",
            pointBorderWidth: 5,
            borderColor: this.#colors.secondary.default,
            data: yAxis,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 2,
          },
        ],
      },
      options: {
        layout: {
          padding: 5,
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          chartAreaBorder: {
            display: this.compactGraph? false:true,
          },
        },
        scales: {
          x: {
            grid: {
              display: this.compactGraph? false:true,
            },
            ticks: {
              display: this.compactGraph? false:true,
            },
            border: {
              display: this.compactGraph? false:true,
            },
          },
          y: {
            grid: {
              display: this.compactGraph? false:true,
            },
            ticks: {
              display: this.compactGraph? false:true,
            },
            max: dataBounds.upper,
            min: dataBounds.lower < 0 ? 0 : dataBounds.lower,
            border: {
              display: false,
            },
          },
        },
        tooltip: {
          label: "eren",
          labelColor: (e) => ({
            backgroundColor: e.dataset.backgroundColor,
          }),
        },
      },
    };

    this.chart = new Chart(ctx, options);
    // window.onload = function () {};
  }
  chartMaxMin(chartDataArray) {
    const maxVal = Math.max(...chartDataArray);
    const minVal = Math.min(...chartDataArray);
    const delta = maxVal - minVal;
    const upperBound = Math.trunc(delta / 10 + maxVal) + 1;
    const lowerBound = Math.trunc(minVal - delta / 10);
    return { lower: lowerBound, upper: upperBound };
  }
}

class Utils {
  static generateColor() {
    const hexArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "A", "B", "C", "D", "E", "F"];
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += hexArray[Math.floor(Math.random() * 16)];
    }
    return `#${code}`;
  }

  static dataFullParse(preParsedData) {
    // TODO - generate fonksiyonlarında yapılan data düzenlemeleri buraya taşınacak
  }
}
