import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card, CardBody } from '@/components/ui/Card';
import { ModuleTag } from '@/components/common/ModuleTag';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { MODULE_LABELS, PRIORITY_LABELS, IMPACT_SCOPE_LABELS, BUSINESS_VALUE_LABELS } from '@/utils/constants';
import type { ModuleType, Priority, ImpactScope, BusinessValue } from '@/types';
import { formatDate } from '@/utils/format';

interface FormData {
  title: string;
  module: ModuleType;
  description: string;
  impactScope: ImpactScope;
  expectedDate: string;
  priority: Priority;
  businessValue: BusinessValue;
  screenshots: string[];
}

interface FormErrors {
  title?: string;
  module?: string;
  description?: string;
  impactScope?: string;
  expectedDate?: string;
}

export default function Submit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const addRequirement = useAppStore((state) => state.addRequirement);
  const updateRequirement = useAppStore((state) => state.updateRequirement);
  const requirements = useAppStore((state) => state.requirements);
  const currentUser = useAppStore((state) => state.currentUser);
  const getStoreById = useAppStore((state) => state.getStoreById);
  
  const isEdit = !!id;
  const existingReq = id ? requirements.find(r => r.id === id) : null;
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    module: 'pos',
    description: '',
    impactScope: 'single',
    expectedDate: '',
    priority: 'medium',
    businessValue: 'medium',
    screenshots: [],
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (existingReq) {
      setFormData({
        title: existingReq.title,
        module: existingReq.module,
        description: existingReq.description,
        impactScope: existingReq.impactScope,
        expectedDate: existingReq.expectedDate,
        priority: existingReq.priority,
        businessValue: existingReq.businessValue,
        screenshots: existingReq.screenshots,
      });
    }
  }, [existingReq]);
  
  const moduleOptions = Object.entries(MODULE_LABELS).map(([value, label]) => ({ value, label }));
  const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
  const impactOptions = Object.entries(IMPACT_SCOPE_LABELS).map(([value, label]) => ({ value, label }));
  const bizValueOptions = Object.entries(BUSINESS_VALUE_LABELS).map(([value, label]) => ({ value, label }));
  
  const userStore = currentUser?.storeId ? getStoreById(currentUser.storeId) : null;
  
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入需求标题';
    } else if (formData.title.length < 5) {
      newErrors.title = '标题至少5个字符';
    }
    
    if (!formData.module) {
      newErrors.module = '请选择所属模块';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请输入需求描述';
    } else if (formData.description.length < 20) {
      newErrors.description = '描述至少20个字符，请详细说明需求';
    }
    
    if (!formData.impactScope) {
      newErrors.impactScope = '请选择影响范围';
    }
    
    if (!formData.expectedDate) {
      newErrors.expectedDate = '请选择期望上线时间';
    } else if (new Date(formData.expectedDate) < new Date()) {
      newErrors.expectedDate = '期望上线时间不能早于今天';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isEdit && id) {
      updateRequirement(id, {
        title: formData.title,
        module: formData.module,
        description: formData.description,
        impactScope: formData.impactScope,
        expectedDate: formData.expectedDate,
        priority: formData.priority,
        businessValue: formData.businessValue,
        screenshots: formData.screenshots,
      });
    } else {
      addRequirement({
        ...formData,
        storeId: currentUser?.storeId || 's001',
        submitterId: currentUser?.id || 'u001',
        priority: formData.priority,
        businessValue: formData.businessValue,
      });
    }
    
    setIsSubmitting(false);
    navigate('/');
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newScreenshots = Array.from(files).map((_, i) => 
        `screenshot_${Date.now()}_${i}.png`
      );
      setFormData(prev => ({
        ...prev,
        screenshots: [...prev.screenshots, ...newScreenshots],
      }));
    }
  };
  
  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };
  
  const handleChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? '编辑需求' : '提交新需求'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            请详细描述您的需求，我们将尽快处理
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <CardBody className="space-y-5">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1e3a5f]" />
                  基本信息
                </h3>
                
                <Input
                  label="需求标题"
                  placeholder="请简要描述您的需求"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={errors.title}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="所属模块"
                    value={formData.module}
                    onChange={(e) => handleChange('module', e.target.value)}
                    options={moduleOptions}
                    error={errors.module}
                    required
                  />
                  
                  <Input
                    type="date"
                    label="期望上线时间"
                    value={formData.expectedDate}
                    onChange={(e) => handleChange('expectedDate', e.target.value)}
                    error={errors.expectedDate}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="影响范围"
                    value={formData.impactScope}
                    onChange={(e) => handleChange('impactScope', e.target.value)}
                    options={impactOptions}
                    error={errors.impactScope}
                    required
                  />
                  
                  <Select
                    label="紧急程度"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    options={priorityOptions}
                  />
                </div>
                
                <Textarea
                  label="需求描述"
                  placeholder="请详细描述您的需求，包括问题背景、期望效果等..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  error={errors.description}
                  rows={6}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    截图上传
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#1e3a5f] transition-colors cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label htmlFor="screenshot-upload" className="cursor-pointer">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 group-hover:text-[#1e3a5f] mb-2 transition-colors" />
                      <p className="text-sm text-gray-600">点击或拖拽上传截图</p>
                      <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，最多5张</p>
                    </label>
                  </div>
                  
                  {formData.screenshots.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.screenshots.map((screenshot, index) => (
                        <div
                          key={index}
                          className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden group"
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeScreenshot(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardBody className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">提交信息</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">提交门店</p>
                    <p className="text-sm font-medium text-gray-900">
                      {userStore?.name || '上海南京东路店'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">所属区域</p>
                    <p className="text-sm text-gray-600">
                      {userStore?.region || '华东区'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">提交人</p>
                    <p className="text-sm text-gray-600">
                      {currentUser?.name || '张伟'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">需求预览</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">模块</p>
                    <ModuleTag module={formData.module} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">优先级</p>
                    <PriorityBadge priority={formData.priority} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">业务价值</p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${
                      formData.businessValue === 'high' ? 'bg-emerald-100 text-emerald-700' :
                      formData.businessValue === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {BUSINESS_VALUE_LABELS[formData.businessValue]}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody className="space-y-3">
                <div className="flex items-start gap-2 text-amber-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">提交须知</p>
                    <p className="text-xs text-amber-600 mt-1">
                      需求提交后将进入待处理状态，产品经理会在3个工作日内进行评估和分配。
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between sticky bottom-6 z-10">
          <p className="text-sm text-gray-500">
            <span className="text-rose-500">*</span> 为必填项
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {}}
            >
              保存草稿
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : isEdit ? '保存修改' : '提交需求'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
