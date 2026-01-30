"use client";
import { apply$, style$ } from "@kithinji/arcane";
import { Component, Navigate, Signal, signal } from "@kithinji/orca";
import { CronService } from "../cron.service";
import { type Cron } from "../entities/cron.entity";

@Component()
export class SidebarModal {
  crons: Signal<Cron[]> = signal([]);
  isLoading = signal(false);

  frequency = signal("daily");
  time = signal("00:00");
  dayOfWeek = signal("1");
  dayOfMonth = signal("1");
  customExpression = signal("");
  timezone = signal("Africa/Nairobi");

  constructor(
    private readonly cronService: CronService,
    private readonly navigate: Navigate,
  ) {
    this.cronService.getCrons().then((crons) => (this.crons.value = crons));
  }

  closeModal() {
    this.navigate.pop();
  }

  buildCronExpression(): string {
    const [hour, minute] = this.time.value.split(":");

    switch (this.frequency.value) {
      case "daily":
        return `${minute} ${hour} * * *`;
      case "weekly":
        return `${minute} ${hour} * * ${this.dayOfWeek.value}`;
      case "monthly":
        return `${minute} ${hour} ${this.dayOfMonth.value} * *`;
      case "custom":
        return this.customExpression.value;
      default:
        return "* * * * *";
    }
  }

  async addCron() {
    this.isLoading.value = true;

    const expr = this.buildCronExpression();
    if (expr.trim()) {
      await this.cronService.createCron(expr, this.timezone.value);
      this.crons.value = await this.cronService.getCrons();
      this.resetForm();
    }

    this.isLoading.value = false;
  }

  resetForm() {
    this.frequency.value = "daily";
    this.time.value = "00:00";
    this.dayOfWeek.value = "1";
    this.dayOfMonth.value = "1";
    this.timezone.value = "Africa/Nairobi";
    this.customExpression.value = "";
  }

  async deleteCron(id: string) {
    await this.cronService.deleteCron(id);
  }

  build() {
    return (
      <div {...apply$(cls.container)}>
        <div {...apply$(cls.overlay)}>
          <div {...apply$(cls.modal)} onClick={(e) => e.stopPropagation()}>
            <h2 {...apply$(cls.title)}>Schedule</h2>

            <div {...apply$(cls.list)}>
              {this.crons.value.map((cron, index) => (
                <div key={index} {...apply$(cls.item)}>
                  <span {...apply$(cls.expr)}>{cron.expression}</span>
                  <button
                    {...apply$(cls.deleteBtn)}
                    onClick={() => this.deleteCron(cron.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div {...apply$(cls.form)}>
              <div {...apply$(cls.formGroup)}>
                <label {...apply$(cls.label)}>Frequency</label>
                <select
                  value={this.frequency.value}
                  onChange={(e: any) => (this.frequency.value = e.target.value)}
                  {...apply$(cls.select)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {this.frequency.value !== "custom" && (
                <>
                  <div {...apply$(cls.formGroup)}>
                    <label {...apply$(cls.label)}>Time</label>
                    <input
                      type="time"
                      value={this.time.value}
                      onInput={(e: any) => (this.time.value = e.target.value)}
                      {...apply$(cls.input)}
                    />
                  </div>

                  <div {...apply$(cls.formGroup)}>
                    <label {...apply$(cls.label)}>Timezone</label>
                    <select
                      value={this.timezone.value}
                      onChange={(e: any) =>
                        (this.timezone.value = e.target.value)
                      }
                      {...apply$(cls.select)}
                    >
                      <option value="UTC">UTC</option>
                      <option value="Africa/Nairobi">Nairobi</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Shanghai">Shanghai</option>
                    </select>
                  </div>

                  {this.frequency.value === "weekly" && (
                    <div {...apply$(cls.formGroup)}>
                      <label {...apply$(cls.label)}>Day of Week</label>
                      <select
                        value={this.dayOfWeek.value}
                        onChange={(e: any) =>
                          (this.dayOfWeek.value = e.target.value)
                        }
                        {...apply$(cls.select)}
                      >
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                        <option value="0">Sunday</option>
                      </select>
                    </div>
                  )}

                  {this.frequency.value === "monthly" && (
                    <div {...apply$(cls.formGroup)}>
                      <label {...apply$(cls.label)}>Day of Month</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={this.dayOfMonth.value}
                        onInput={(e: any) =>
                          (this.dayOfMonth.value = e.target.value)
                        }
                        {...apply$(cls.input)}
                      />
                    </div>
                  )}
                </>
              )}

              {this.frequency.value === "custom" && (
                <div {...apply$(cls.formGroup)}>
                  <label {...apply$(cls.label)}>Cron Expression</label>
                  <input
                    type="text"
                    placeholder="* * * * *"
                    value={this.customExpression.value}
                    onInput={(e: any) =>
                      (this.customExpression.value = e.target.value)
                    }
                    {...apply$(cls.input, cls.monoInput)}
                  />
                </div>
              )}

              <div {...apply$(cls.preview)}>
                <span {...apply$(cls.previewLabel)}>Preview:</span>
                <span {...apply$(cls.previewExpr)}>
                  {this.buildCronExpression()}
                </span>
              </div>

              <button {...apply$(cls.addBtn)} onClick={() => this.addCron()}>
                {this.isLoading.value ? "adding..." : "+ Add Schedule"}
              </button>
            </div>

            <div {...apply$(cls.footer)}>
              <button
                {...apply$(cls.cancelBtn)}
                onClick={() => this.closeModal()}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const cls = style$({
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  overlay: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(15, 15, 15, 0.46)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "1000",
  },
  modal: {
    backgroundColor: "#161616",
    borderRadius: "12px",
    padding: "24px",
    width: "500px",
    maxWidth: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  title: {
    margin: "0 0 20px 0",
    fontSize: "20px",
    fontWeight: "600",
    color: "#ffffff",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
    maxHeight: "200px",
    overflowY: "auto",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    backgroundColor: "#242424",
    borderRadius: "8px",
    border: "1px solid #2a2a2a",
  },
  expr: {
    fontFamily: "monospace",
    color: "#ffffff",
    fontSize: "14px",
  },
  deleteBtn: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    border: "1px solid #ef4444",
    borderRadius: "6px",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "12px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "20px",
    padding: "16px",
    backgroundColor: "#242424",
    borderRadius: "8px",
    border: "1px solid #2a2a2a",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    color: "#9ca3af",
    fontWeight: "500",
  },
  input: {
    padding: "10px 12px",
    backgroundColor: "#242424",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "14px",
  },
  monoInput: {
    fontFamily: "monospace",
  },
  select: {
    padding: "10px 12px",
    backgroundColor: "#242424",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "14px",
    cursor: "pointer",
  },
  preview: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "#242424",
    borderRadius: "6px",
    border: "1px solid #2a2a2a",
  },
  previewLabel: {
    fontSize: "13px",
    color: "#9ca3af",
    fontWeight: "500",
  },
  previewExpr: {
    fontFamily: "monospace",
    color: "#ff5722",
    fontSize: "14px",
    fontWeight: "600",
  },
  addBtn: {
    padding: "12px 20px",
    backgroundColor: "#ff5722",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  footer: {
    display: "flex",
    justifyContent: "center",
  },
  cancelBtn: {
    padding: "10px 24px",
    backgroundColor: "transparent",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "14px",
  },
});
