import streamlit as st
import plotly.graph_objects as go
from PIL import Image
import tempfile, os
from datetime import datetime
from src.pipeline import load_models, run_pipeline
from src.gradcam import get_gradcam_overlay
from src.report import generate_pdf_report

st.set_page_config(
    page_title='NeuroVision AI',
    page_icon='🧠',
    layout='wide',
    initial_sidebar_state='expanded',
)

# ── CSS ──────────────────────────────────────────────────
st.html("""
<style>
#MainMenu, footer, header {visibility: hidden;}

.nv-logo {
  font-size: 20px; font-weight: 600; color: #c9d1d9;
  display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
}
.beta-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 20px;
  background: rgba(124,58,237,0.2); color: #a78bfa;
  border: 1px solid rgba(124,58,237,0.3);
}
.pills {display: flex; gap: 8px; margin-bottom: 16px;}
.pill {
  font-size: 11px; padding: 4px 12px; border-radius: 20px;
  border: 1px solid #21262d; color: #6e7681;
}
.pill-done {
  background: rgba(22,163,74,0.12);
  border-color: rgba(22,163,74,0.4); color: #4ade80;
}
.pill-active {
  background: rgba(124,58,237,0.15);
  border-color: rgba(124,58,237,0.4); color: #a78bfa;
}
.metric-row {display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px;}
.metric-card {
  background: #161b22; border: 1px solid #21262d;
  border-radius: 10px; padding: 12px 14px;
}
.metric-label {font-size: 11px; color: #6e7681; margin-bottom: 4px;}
.metric-val   {font-size: 20px; font-weight: 600;}
.metric-sub   {font-size: 10px; color: #6e7681; margin-top: 2px;}
.result-card  {border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid;}
.result-card-high   {border-color: rgba(239,68,68,0.5);  background: rgba(239,68,68,0.06);}
.result-card-medium {border-color: rgba(249,115,22,0.5); background: rgba(249,115,22,0.06);}
.result-card-low    {border-color: rgba(22,163,74,0.5);  background: rgba(22,163,74,0.06);}
.result-card-none   {border-color: rgba(22,163,74,0.5);  background: rgba(22,163,74,0.06);}
.result-top  {display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;}
.result-title{font-size: 20px; font-weight: 600; color: #fff;}
.result-sub  {font-size: 12px; color: #8b949e; margin-top: 2px;}
.risk-high   {font-size: 11px; padding: 3px 10px; border-radius: 4px; background: rgba(239,68,68,0.2);  color: #f87171; border: 1px solid rgba(239,68,68,0.4);}
.risk-medium {font-size: 11px; padding: 3px 10px; border-radius: 4px; background: rgba(249,115,22,0.2); color: #fb923c; border: 1px solid rgba(249,115,22,0.4);}
.risk-low    {font-size: 11px; padding: 3px 10px; border-radius: 4px; background: rgba(22,163,74,0.2);  color: #4ade80; border: 1px solid rgba(22,163,74,0.4);}
.risk-none   {font-size: 11px; padding: 3px 10px; border-radius: 4px; background: rgba(22,163,74,0.2);  color: #4ade80; border: 1px solid rgba(22,163,74,0.4);}
.result-desc {font-size: 12px; color: #8b949e; line-height: 1.7; border-top: 1px solid #21262d; padding-top: 10px;}
.conf-row    {display: flex; align-items: center; gap: 8px; margin-bottom: 6px;}
.conf-name   {font-size: 11px; color: #8b949e; width: 90px; flex-shrink: 0;}
.conf-track  {flex: 1; height: 5px; background: #21262d; border-radius: 3px; overflow: hidden;}
.conf-fill   {height: 100%; border-radius: 3px; background: #7c3aed;}
.conf-pct    {font-size: 11px; color: #c9d1d9; width: 36px; text-align: right;}
.disc {
  background: #161b22; border: 1px solid #21262d; border-radius: 8px;
  padding: 10px 14px; font-size: 11px; color: #6e7681;
  line-height: 1.6; margin-top: 8px;
}
</style>
""")

# ── Load models ───────────────────────────────────────────
stage1_model, stage2_model, model_error = load_models()
if model_error:
    st.warning(model_error)

# ── Sidebar ───────────────────────────────────────────────
with st.sidebar:
    st.html("""
    <div class="nv-logo">
      🧠 NeuroVision AI <span class="beta-badge">BETA</span>
    </div>
    <p style="font-size:11px;color:#6e7681;margin-bottom:16px;">
      Advanced MRI Neuro-Diagnostic System
    </p>
    """)

    uploaded = st.file_uploader(
        'Upload Brain MRI Scan',
        type=['jpg','jpeg','png','webp'],
        help='T1 / T1C+ / T2 MRI — max 10 MB'
    )

    modality = st.selectbox(
        'MRI Modality',
        ['Auto-detect', 'T1', 'T1C+', 'T2']
    )

    conf_threshold = st.slider(
        'Confidence threshold (%)',
        min_value=0, max_value=100, value=60, step=5,
        help='Predictions below this are flagged as low confidence'
    )

    st.markdown('---')

    # Stage 1 confidence bars rendered after prediction
    if 'result' in st.session_state:
        r = st.session_state.result
        st.html('<p style="font-size:11px;color:#6e7681;text-transform:uppercase;letter-spacing:.05em;">Stage 1 — Tumor type</p>')
        bars_html = ''
        for cls, pct in r['stage1_confidences'].items():
            is_top = pct == max(r['stage1_confidences'].values())
            fill   = '#7c3aed' if is_top else '#21262d'
            weight = '500' if is_top else '400'
            color  = '#a78bfa' if is_top else '#6e7681'
            bars_html += f"""
            <div class="conf-row">
              <span class="conf-name">{cls.capitalize()}</span>
              <div class="conf-track">
                <div class="conf-fill" style="width:{pct}%;background:{fill};"></div>
              </div>
              <span class="conf-pct" style="font-weight:{weight};color:{color};">{pct}%</span>
            </div>"""
        st.html(bars_html)

# ── Main panel ────────────────────────────────────────────
if uploaded is None:
    # Empty state
    st.html("""
    <div style="text-align:center;padding:80px 20px;color:#6e7681;">
      <div style="font-size:48px;margin-bottom:16px;">🧠</div>
      <div style="font-size:18px;font-weight:500;color:#c9d1d9;margin-bottom:8px;">
        Upload a Brain MRI Scan to begin
      </div>
      <div style="font-size:13px;">
        Accepts T1 / T1C+ / T2 — JPG, JPEG, PNG, WEBP — max 10 MB
      </div>
    </div>
    """)
    st.stop()

# ── Run prediction ────────────────────────────────────────
pil_image = Image.open(uploaded).convert('RGB')

if 'result' not in st.session_state or \
   st.session_state.get('last_file') != uploaded.name:
    with st.spinner('Running pipeline...'):
        result = run_pipeline(
            pil_image, stage1_model, stage2_model, modality
        )
        gradcam_img = get_gradcam_overlay(
            stage1_model, pil_image,
            result['pred_type_idx']
        )
        st.session_state.result       = result
        st.session_state.gradcam_img  = gradcam_img
        st.session_state.last_file    = uploaded.name

result      = st.session_state.result
gradcam_img = st.session_state.gradcam_img

# ── Layout ────────────────────────────────────────────────
col_left, col_right = st.columns([1, 1.4], gap='large')

with col_left:
    st.image(pil_image,     caption='Original MRI',        use_container_width=True)
    st.image(gradcam_img,   caption='GradCAM Activation',  use_container_width=True)

with col_right:
    # Stage pills
    all_done = result['tumor_type'] != ''
    s2_done  = result['severity_class'] != ''
    p1 = 'pill-done' if all_done else 'pill'
    p2 = 'pill-done' if s2_done  else 'pill'
    p3 = 'pill-active' if all_done else 'pill'
    st.html(f"""
    <div class="pills">
      <span class="{p1}">✓ Stage 1: Type</span>
      <span class="{p2}">✓ Stage 2: Severity</span>
      <span class="{p3}">⚡ GradCAM</span>
      <span class="pill pill-done">🔁 TTA ×8</span>
    </div>""")

    # Metric cards
    risk      = result['risk_level']
    risk_col  = {'high':'#f87171','medium':'#fb923c',
                 'low':'#4ade80','none':'#4ade80'}.get(risk,'#c9d1d9')
    st.html(f"""
    <div class="metric-row">
      <div class="metric-card">
        <div class="metric-label">Tumor type</div>
        <div class="metric-val" style="color:#a78bfa;">{result['tumor_type']}</div>
        <div class="metric-sub">Stage 1 · {result['stage1_top_pct']}% conf.</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Risk level</div>
        <div class="metric-val" style="color:{risk_col};">{risk.capitalize()}</div>
        <div class="metric-sub">{result['severity_class']}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">MRI modality</div>
        <div class="metric-val" style="font-size:16px;color:#c9d1d9;">{result['modality']}</div>
        <div class="metric-sub">Selected input type</div>
      </div>
    </div>""")

    low_conf = result['stage1_top_pct'] < conf_threshold
    warn = (
        '<br><span style="color:#fb923c;font-size:11px;">'
        f'⚠️ Stage 1 confidence is {result["stage1_top_pct"]}% — below your '
        f'{conf_threshold}% threshold. Consider retraining the model or '
        f'lowering the threshold for exploratory use.</span>'
    ) if low_conf else ''
    st.html(f"""
    <div class="result-card result-card-{risk}">
      <div class="result-top">
        <div>
          <div class="result-title">{result['tumor_type']} detected</div>
          <div class="result-sub">{result['severity_class']} · {result['modality']}</div>
        </div>
        <span class="risk-{risk}">{risk.upper()} RISK</span>
      </div>
      <div class="result-desc">{result['description']}{warn}</div>
    </div>""")

    # Stage 2 Plotly chart
    s2   = result['stage2_confidences']
    cols = list(s2.keys())
    vals = list(s2.values())
    max_v = max(vals) if vals else 1
    colors = ['#ef4444' if v == max_v else '#374151' for v in vals]

    fig = go.Figure(go.Bar(
        x=vals, y=cols, orientation='h',
        marker_color=colors,
        text=[f'{v:.1f}%' for v in vals],
        textposition='inside',
        textfont=dict(color='#fff', size=11),
    ))
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='#161b22',
        font_color='#8b949e',
        margin=dict(l=0,r=10,t=30,b=0),
        height=210,
        xaxis=dict(range=[0,100], gridcolor='#21262d',
                   title='Confidence (%)', tickfont=dict(size=10)),
        yaxis=dict(gridcolor='#21262d', tickfont=dict(size=11)),
        title=dict(text='Stage 2 — Severity class confidence',
                   font=dict(color='#8b949e', size=12)),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Disclaimer
    st.html("""
    <div class="disc">
      🛡️ <strong>For research use only</strong> — not a diagnostic tool.
      This system uses deep learning to predict MRI anomalies and must not
      substitute professional clinical diagnosis.
    </div>""")

# ── Footer ────────────────────────────────────────────────
st.markdown('---')
foot_l, foot_m, foot_r = st.columns([2, 1, 1])

with foot_l:
    st.html('<p style="font-size:11px;color:#484f58;padding-top:8px;">T1 / T1C+ / T2 — max 10 MB — .jpg .jpeg .png .webp</p>')

with foot_m:
    if st.button('🔄 New scan', use_container_width=True):
        for k in ['result','gradcam_img','last_file']:
            st.session_state.pop(k, None)
        st.rerun()

with foot_r:
    if st.button('📄 Export PDF', use_container_width=True):
        with st.spinner('Generating PDF...'):
            orig_tmp = tempfile.NamedTemporaryFile(
                delete=False, suffix='.png')
            orig_tmp.close()
            pil_image.save(orig_tmp.name)

            cam_tmp = tempfile.NamedTemporaryFile(
                delete=False, suffix='.png')
            cam_tmp.close()
            gradcam_img.save(cam_tmp.name)

            pdf_path = generate_pdf_report(
                st.session_state.result,
                orig_tmp.name,
                cam_tmp.name,
            )

            # Read bytes into memory BEFORE deleting files
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()

            # Now safe to delete all temp files
            for path in [orig_tmp.name, cam_tmp.name, pdf_path]:
                try:
                    os.unlink(path)
                except Exception:
                    pass  # ignore cleanup errors on Windows

            st.download_button(
                label='⬇️ Download PDF',
                data=pdf_bytes,
                file_name=f"neurovision_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf",
                mime='application/pdf',
                use_container_width=True,
            )
