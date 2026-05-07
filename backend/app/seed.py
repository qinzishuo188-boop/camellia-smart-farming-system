import json
import random
from datetime import datetime, timedelta
from sqlmodel import Session, select
from .algorithms import calculate_growth_score, create_warnings_for_record, detect_growth_stage, generate_decisions, latest_environment
from .database import engine, init_db
from .models import (
    DecisionRecord,
    DecisionRule,
    EnvironmentRecord,
    FarmingLog,
    GrowthRecord,
    GrowthStage,
    KnowledgeArticle,
    Organization,
    PestDiseaseKnowledge,
    Plot,
    SystemConfig,
    User,
)
from .security import hash_password


def seed() -> None:
    init_db()
    random.seed(42)
    with Session(engine) as session:
        if session.exec(select(User)).first():
            return
        orgs = [
            Organization(name="常宁油茶数字示范合作社", type="合作社", contact_person="刘青", contact_phone="13800000001", address="湖南省常宁市示范镇"),
            Organization(name="湘南山茶农业科技有限公司", type="企业", contact_person="周林", contact_phone="13800000002", address="湖南省衡阳市"),
            Organization(name="基层农技推广服务站", type="农技站", contact_person="何工", contact_phone="13800000003", address="湖南省常宁市"),
        ]
        session.add_all(orgs)
        session.commit()
        for org in orgs:
            session.refresh(org)
        roles = ["admin", "org_admin", "farmer", "expert"]
        users = [User(username="admin", password_hash=hash_password("Admin@123456"), phone="13900000000", role="admin", organization_id=orgs[0].id)]
        for i in range(9):
            users.append(User(username=f"user{i+1}", password_hash=hash_password("User@123456"), phone=f"139000000{i+1}", role=roles[(i % 3) + 1], organization_id=orgs[i % 3].id))
        session.add_all(users)
        session.commit()
        for user in users:
            session.refresh(user)

        stage_defs = [
            ("休眠期", 12, 1, 2, 28, 60, "防寒、防冻、控水"),
            ("萌芽抽梢期", 3, 1, 5, 31, 50, "促进新梢，适量施肥"),
            ("开花坐果期", 4, 1, 6, 30, 80, "保花保果，防病虫害"),
            ("果实膨大期", 6, 1, 9, 30, 70, "水肥供应，促进油脂积累"),
            ("果实成熟期", 9, 1, 11, 30, 65, "控水、防裂果、防霉变"),
            ("采收恢复期", 10, 1, 12, 31, 55, "采收、修剪、补肥"),
        ]
        stages = [GrowthStage(stage_name=n, start_month=sm, start_day=sd, end_month=em, end_day=ed, priority=p, description=f"{n}阶段", management_focus=f) for n, sm, sd, em, ed, p, f in stage_defs]
        session.add_all(stages)
        session.commit()
        for s in stages:
            session.refresh(s)
        stage_map = {s.stage_name: s for s in stages}
        rules = [
            ("萌芽抽梢期灌溉", "萌芽抽梢期", {"soil_moisture": {"lt": 35}, "air_temperature": {"between": [10, 25]}}, "灌溉建议", "建议适量灌溉，保持土壤湿润，促进新梢生长。", "关注", 80, "通用", "普通油茶", False),
            ("果实膨大期水肥", "果实膨大期", {"soil_moisture": {"lt": 40}, "air_temperature": {"gt": 20}}, "施肥建议", "建议及时灌溉，并补充钾肥，促进果实膨大和油脂积累。", "警告", 90, "通用", "普通油茶", False),
            ("成熟期排水", "果实成熟期", {"soil_moisture": {"gt": 80}}, "排水建议", "建议及时排水，防止裂果和霉变。", "警告", 85, "通用", "普通油茶", True),
            ("休眠期防冻", "休眠期", {"air_temperature": {"lt": 0}}, "防冻建议", "存在冻害风险，建议进行覆盖防寒和树干保护。", "严重", 95, "通用", "普通油茶", True),
            ("高湿病害防控", "开花坐果期", {"air_humidity": {"gt": 85}, "air_temperature": {"gt": 25}}, "病虫害防治", "病害风险较高，建议加强通风、降低湿度，并巡查叶片和花果状态。", "警告", 88, "通用", "普通油茶", True),
        ]
        session.add_all([
            DecisionRule(stage_id=stage_map[stage].id, rule_name=name, condition_json=json.dumps(cond), suggestion_type=typ, suggestion_content=content, risk_level=risk, priority=priority, rule_version="1.0", applicable_region=region, applicable_variety=variety, requires_expert_review=expert_review)
            for name, stage, cond, typ, content, risk, priority, region, variety, expert_review in rules
        ])
        session.commit()

        current_stage = detect_growth_stage(session)
        varieties = ["普通油茶", "红花油茶", "小果油茶", "湘林210", "长林53"]
        soils = ["红壤", "黄壤", "沙壤"]
        irrigation_types = ["drip", "sprinkler", "manual", None]
        plots = []
        for i in range(20):
            plots.append(Plot(
                organization_id=orgs[i % 3].id,
                user_id=users[(i % 8) + 1].id,
                plot_name=f"{chr(65 + i % 6)}区油茶园-{i+1}",
                plot_code=f"CT-{i+1:03d}",
                area=round(random.uniform(8, 65), 1),
                town=random.choice(["示范镇", "西岭镇", "宜阳镇", "培元街道"]),
                village=random.choice(["油茶村", "青山村", "双溪村", "茶岭村"]),
                longitude=round(112.1 + random.random() / 2, 6),
                latitude=round(26.1 + random.random() / 2, 6),
                variety=random.choice(varieties),
                tree_age=random.randint(3, 12),
                plant_year=random.randint(2014, 2023),
                soil_type=random.choice(soils),
                management_mode="智能管理" if i % 2 == 0 else "传统管理",
                irrigation_type=random.choice(irrigation_types),
                soil_ph=round(random.uniform(5.0, 6.8), 1),
                current_stage=current_stage,
            ))
        session.add_all(plots)
        session.commit()
        for p in plots:
            session.refresh(p)

        envs = []
        for i in range(300):
            plot = plots[i % len(plots)]
            day = datetime.utcnow() - timedelta(days=random.randint(0, 59), hours=random.randint(0, 23))
            stress = i % 17 == 0
            envs.append(EnvironmentRecord(
                plot_id=plot.id,
                soil_moisture=round(random.uniform(22, 88) if stress else random.uniform(38, 72), 1),
                soil_temperature=round(random.uniform(8, 28), 1),
                air_temperature=round(random.uniform(-2, 38) if stress else random.uniform(12, 31), 1),
                air_humidity=round(random.uniform(45, 92), 1),
                light_intensity=round(random.uniform(1800, 22000), 1),
                ph_value=round(random.uniform(4.7, 7.4) if stress else random.uniform(5.2, 6.8), 2),
                rainfall=round(random.uniform(0, 35), 1),
                wind_speed=round(random.uniform(0.5, 9), 1),
                data_source="demo",
                recorded_at=day,
            ))
        session.add_all(envs)
        session.commit()
        for env in envs[:80]:
            create_warnings_for_record(session, env)

        growths = []
        for i in range(100):
            plot = plots[i % len(plots)]
            record = GrowthRecord(
                plot_id=plot.id,
                management_type=plot.management_mode,
                tree_age=plot.tree_age,
                shoot_length=round(random.uniform(7, 22) + (2 if plot.management_mode == "智能管理" else 0), 1),
                leaf_color=random.choices(["深绿", "浅绿", "发黄", "枯黄"], weights=[55, 28, 13, 4])[0],
                leaf_status=random.choices(["正常", "卷曲", "斑点", "脱落"], weights=[70, 12, 14, 4])[0],
                disease_level=random.choices(["无", "轻微", "中等", "严重"], weights=[55, 28, 13, 4])[0],
                flowering_status=random.choice(["无", "少量", "正常", "较多"]),
                fruiting_status=random.choice(["无", "少量", "正常", "较多"]),
                fruit_status=random.choices(["正常", "裂果", "霉变", "脱落"], weights=[78, 10, 6, 6])[0],
                data_source="demo",
                recorded_at=datetime.utcnow() - timedelta(days=random.randint(0, 90)),
                remark="巡园记录，长势持续跟踪。",
            )
            record.growth_score = calculate_growth_score(record)
            growths.append(record)
        session.add_all(growths)

        logs = []
        for i in range(80):
            logs.append(FarmingLog(
                plot_id=plots[i % len(plots)].id,
                operation_type=random.choice(["灌溉", "施肥", "修剪", "除草", "病虫害防治", "排水", "防冻", "采收", "巡园"]),
                operation_time=datetime.utcnow() - timedelta(days=random.randint(0, 90)),
                operator=random.choice(["张师傅", "李农户", "王技术员", "自动任务"]),
                materials=random.choice(["有机肥", "钾肥", "生物药剂", "清水", ""]),
                dosage=random.choice(["20kg/亩", "30kg/亩", "2L/亩", "按需"]),
                cost=round(random.uniform(30, 500), 2),
                description="按系统建议完成操作并记录现场情况。",
                data_source="demo",
            ))
        session.add_all(logs)

        pests = [
            ("炭疽病", "病害", "叶片有斑点,果实霉变", "高湿和通风不良", "高温高湿", "清园、合理修剪", "摘除病叶病果，使用绿色防控药剂。"),
            ("软腐病", "病害", "果实霉变,枝条枯萎", "雨后湿度过高", "连续降雨", "排水降湿", "及时排水，清理病果并消毒。"),
            ("叶斑病", "病害", "叶片有斑点,叶片发黄", "病原菌侵染", "湿热环境", "增强通风", "清除病叶，必要时喷施保护性药剂。"),
            ("蚜虫", "虫害", "叶片卷曲,叶片虫咬", "嫩梢期虫口上升", "萌芽抽梢期", "保护天敌", "使用黄板诱杀或生物药剂。"),
            ("红蜘蛛", "虫害", "叶片发黄,叶片卷曲", "干热环境", "高温干旱", "保持适度湿度", "重点检查叶背，采用绿色防控。"),
            ("介壳虫", "虫害", "枝条枯萎,树势衰弱", "枝干虫害", "郁闭园区", "冬季清园", "刮除虫体并结合修剪处理。"),
            ("根腐风险", "生理风险", "树势衰弱,落花落果", "积水缺氧", "土壤湿度过高", "完善排水", "降低土壤湿度，改良根际环境。"),
        ]
        pest_rows = []
        for i in range(20):
            base = pests[i % len(pests)]
            pest_rows.append(PestDiseaseKnowledge(name=base[0] if i < 7 else f"{base[0]}防控方案{i}", type=base[1], symptoms=base[2], cause=base[3], risk_condition=base[4], prevention_method=base[5], treatment_method=base[6]))
        session.add_all(pest_rows)

        categories = ["油茶生长阶段", "灌溉管理", "施肥管理", "修剪管理", "病虫害防治", "防冻防灾", "采收加工", "常见问题"]
        session.add_all([KnowledgeArticle(title=f"{cat}实用指南", category=cat, summary=f"{cat}关键管理要点", content=f"围绕{cat}建立标准化操作流程，结合环境监测和长势记录及时调整。") for cat in categories])
        session.commit()

        for plot in plots[:10]:
            record = latest_environment(session, plot.id)
            if not record:
                continue
            for rule, typ, content, risk, confidence, version in generate_decisions(session, plot, record)[:2]:
                session.add(DecisionRecord(plot_id=plot.id, stage_name=plot.current_stage or current_stage, input_json=json.dumps(record.model_dump(mode="json"), ensure_ascii=False), matched_rule_id=rule.id if rule else None, suggestion_type=typ, suggestion_content=content, risk_level=risk, data_source="demo", confidence=confidence))
        session.commit()

        session.add(SystemConfig(key="system_mode", value="demo", description="系统运行模式：demo=演示模式, production=生产模式"))
        session.commit()


if __name__ == "__main__":
    seed()
